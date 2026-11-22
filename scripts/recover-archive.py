"""Optional recovery tool. Run using Python with beautifulsoup4 installed.
Fetches the user-supplied archive, strips WordPress UI, and records provenance.
Does not overwrite the curated site data. Output: src/data/recovered.json.
"""
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import urlopen, Request
from urllib.parse import urlparse
from pathlib import Path
import re,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
SNAP='https://web.archive.org/web/20260309175445id_/'
CACHE=Path('/tmp/jupiter-recovery'); CACHE.mkdir(exist_ok=True)

def fetch(url,timeout=22):
 with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=timeout) as r: return r.read(),r.headers.get('Content-Type',''),r.url

def clean(fragment):
 f=BeautifulSoup(fragment,'html.parser')
 for e in f(['script','style','iframe','form','input','button','noscript','svg']):e.decompose()
 allowed={'p','h2','h3','h4','ul','ol','li','strong','em','a','blockquote','br','figure','figcaption','img','table','thead','tbody','tr','td','th'}
 for e in list(f.find_all()):
  if e.name not in allowed: e.unwrap();continue
  if e.name=='img':
   src=e.get('data-lazy-src') or e.get('src','')
   if not src.startswith('https://'):e.decompose();continue
   alt=e.get('alt','');e.attrs={'src':src,'alt':alt,'loading':'lazy','decoding':'async'}
  elif e.name=='a':
   href=e.get('href','')
   if 'jupiterkonnections.com' in href and '/wp-content/' not in href:href=urlparse(href).path or '/'
   e.attrs={'href':href} if href.startswith(('https://','http://','/','mailto:','#')) else {}
   if href.startswith(('https://','http://')):e['rel']='noopener noreferrer'
  else:e.attrs={}
 return str(f)

def recover(path):
 key=path.strip('/').replace('/','--') or 'home'; file=CACHE/(key+'.html')
 try:
  if path=='/':raw=Path('/tmp/jupiter-archive.html').read_bytes(); final=SNAP+'https://jupiterkonnections.com/'
  elif file.exists():
   raw=file.read_bytes();source_file=file.with_suffix('.source.txt');final=source_file.read_text() if source_file.exists() else SNAP+'https://jupiterkonnections.com'+path
  else:raw,_,final=fetch(SNAP+'https://jupiterkonnections.com'+path);file.write_bytes(raw)
  s=BeautifulSoup(raw,'html.parser'); area=s.select_one('[data-elementor-type="wp-post"], [data-elementor-type="wp-page"], .entry-content')
  if not area:raise ValueError('No article content in snapshot')
  def meta(name):
   x=s.select_one(f'meta[property="{name}"],meta[name="{name}"]');return x.get('content','') if x else ''
  title=s.select_one('h1'); title=title.get_text(' ',strip=True) if title else meta('og:title')
  blocks=[]
  widgets=area.select('.elementor-widget-text-editor,.elementor-widget-heading,.elementor-widget-image,.elementor-widget-image-gallery,.elementor-widget-gallery,.elementor-widget-theme-post-content')
  if widgets:
   for w in widgets:
    if any(parent in widgets for parent in w.parents):continue
    if w.select_one('h1'):continue
    text=w.get_text(' ',strip=True)
    if re.fullmatch(r'\d+ MINUTE READ',text,re.I):continue
    if 'IMAGE CREDIT' in text.upper():continue
    blocks.append(clean(str(w)))
  else:blocks=[clean(str(area))]
  html='\n'.join(blocks)
  images=[]
  for i in area.select('img'):
   src=i.get('data-lazy-src') or i.get('src','')
   if src.startswith('https://') and src not in images and 'logo' not in src.lower():images.append(src)
  for i in area.select('a[href]'):
   if re.search(r'\.(jpg|jpeg|webp|png)(\?|$)',i['href']) and i['href'] not in images:images.append(i['href'])
  return path,{'title':title,'description':meta('og:description'),'published':meta('article:published_time'),'hero':meta('og:image') or (images[0] if images else ''),'images':images,'html':html,'source':final,'status':'recovered'}
 except Exception as e:return path,{'status':'unavailable','error':str(e),'source':SNAP+'https://jupiterkonnections.com'+path}

if __name__=='__main__':
 paths=list(dict.fromkeys(urlparse(x).path.rstrip('/')+'/' for x in re.findall(r'https://jupiterkonnections.com/\S*', (ROOT/'docs/original-sitemap.txt').read_text())))
 paths=[p for p in paths if not p.startswith(('/category/','/product-tag/','/product-category/','/project-type/','/shop/')) and p not in ['/journal/','/portfolio/','/link-in-bio/','/contact/','/return-and-refund-policy/']]
 paths+=['/travel-to-antarctica/','/iceland-roadtrip-top-camping-and-adventure-routes/','/festivals-from-india-my-journey-in-traditions-and-celebrations/','/the-wonders-of-the-world-a-journey-of-wonder-and-discovery/']
 result_file=ROOT/'src/data/recovered.json'
 previous=json.loads(result_file.read_text()) if result_file.exists() else {}
 result={}
 with ThreadPoolExecutor(max_workers=6) as pool:
  for f in as_completed([pool.submit(recover,p) for p in paths]):
   p,data=f.result()
   if data['status']=='unavailable' and previous.get(p,{}).get('status')=='recovered':data=previous[p]
   result[p]=data;print(p,data['status'],flush=True)
 (ROOT/'src/data/recovered.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
 print('Recovered',sum(x['status']=='recovered' for x in result.values()),'of',len(result),flush=True)
