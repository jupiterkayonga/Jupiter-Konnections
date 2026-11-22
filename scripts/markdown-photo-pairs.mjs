// Astro may mark local images before this plugin visits their parent paragraph.
function imageProperties(image) {
  const props = image.properties || {};
  const marked = props.__ASTRO_IMAGE_;
  if (typeof marked !== 'string') return props;
  try { return { ...props, ...JSON.parse(marked) }; } catch { return props; }
}
// Optimize standalone feature photographs, pairs, and balanced galleries.
export default {
  name: 'article-photo-groups',
  element: {
    filter: ['p'],
    visit(node, ctx) {
      const content = (node.children || []).filter(child => child.type !== 'text' || child.value.trim());
      if (content.length < 1 || !content.every(child => child.type === 'element' && child.tagName === 'img')) return;
      const feature = content.length === 1;
      const gallery = content.length > 2;
      const recovered = !feature && content.every(image => String(imageProperties(image).src || '').match(/iceland-recovered-|cuba-journey-|cuban-passion-|habana-running-|kilimanjaro-|zanzibar-|antarctica-expedition-|india-festivals-|almendrones-|faces-india-|experiencing-holi-/)); 
      const skutafoss = content.length === 4 && content.every(image => /iceland-recovered-(05|01|12|11)/.test(String(imageProperties(image).src || '')));
      const tallPair = content.length === 2 && content.every(image => /kilimanjaro-fullmoon-(moorland|senecios)|cuba-journey-portrait-/.test(String(imageProperties(image).src || '')));
      const portraitGallery = content.length > 1 && content.every(image => /faces-india-portrait-|almendrones-detail-|cuba-journey-portrait-|cuban-passion-boxing/.test(String(imageProperties(image).src || '')));
      const photographyGroup = content.length > 1 && content.every(image => /faces-india-|experiencing-holi-|almendrones-|cuban-passion-/.test(String(imageProperties(image).src || '')));
      const twoByTwo = content.length === 4;
      const wondersGallery = content.length === 3 && content.every(image => /Machu Picchu|Taj Mahal/.test(String(imageProperties(image).alt || '')));
      const glacierMosaic = content.length === 6 && content.every(image => String(imageProperties(image).src || '').includes('iceland-skaftafell-hike-'));
      const lagoonMosaic = content.length === 5 && content.every(image => String(imageProperties(image).src || '').includes('iceland-lagoon-diamond-'));
      ctx.setProperty(node, 'className', feature ? ['article-photo-feature', ...(String(imageProperties(content[0]).src || '').match(/kilimanjaro-(?:(?:fullmoon-)?summit-portrait|fullmoon-(?:karanga|barranco)-day)/) ? ['article-photo-feature-portrait'] : [])] : gallery ? ['article-masonry', ...(portraitGallery ? ['article-portrait-gallery'] : []), ...(wondersGallery ? ['article-wonders-gallery'] : []), ...(twoByTwo ? ['article-two-by-two'] : []), ...(skutafoss ? ['article-masonry-skutafoss'] : []), ...((recovered || twoByTwo) ? ['article-masonry-recovered', `article-masonry-count-${content.length}`] : []), ...(lagoonMosaic ? ['article-masonry-lagoon'] : []), ...(glacierMosaic ? ['article-masonry-glacier'] : []), ...(content.length === 7 ? ['article-masonry-seven'] : []), ...(content.length === 9 ? ['article-masonry-nine'] : [])] : ['article-photo-pair', ...(tallPair ? ['article-photo-pair-tall'] : []), ...(portraitGallery ? ['article-portrait-gallery'] : []), ...(recovered ? ['article-photo-pair-recovered'] : [])]);
      if (gallery) {
        ctx.setProperty(node, 'role', 'group');
        ctx.setProperty(node, 'aria-label', 'Travel photo gallery');
      }
      for (const [index, image] of content.entries()) {
        const wideTile = !gallery || (recovered && (content.length === 4 || (content.length === 5 && index >= 3)));
        const panoramaTile = glacierMosaic && index === 1;
        const fullWidthTile = (content.length === 7 && index === 6) || (lagoonMosaic && index === 4);
        const properties = {
          width: feature ? 2000 : 1600, widths: feature ? [480, 768, 1200, 1600, 2000] : [480, 768, 1200, 1600], format: 'webp', quality: 85,
          loading: 'lazy', decoding: 'async',
          sizes: photographyGroup
            ? (wideTile ? '(min-width: 1112px) 491px, (min-width: 761px) calc((100vw - 82px) / 2), calc(100vw - 40px)' : '(min-width: 1112px) 321px, (min-width: 761px) calc((100vw - 100px) / 3), calc(100vw - 40px)')
            : feature
            ? '(min-width: 1112px) 990px, (min-width: 1001px) calc(100vw - 112px), (min-width: 761px) calc(100vw - 64px), calc(100vw - 40px)'
            : fullWidthTile
            ? '(min-width: 1112px) 740px, (min-width: 1001px) calc(100vw - 362px), (min-width: 761px) calc(100vw - 249px), calc(100vw - 40px)'
            : panoramaTile
            ? '(min-width: 1112px) 488px, (min-width: 1001px) calc((100vw - 362px) * 2 / 3 - 6px), (min-width: 761px) calc((100vw - 249px) * 2 / 3 - 6px), calc(100vw - 40px)'
            : !wideTile
            ? '(min-width: 1112px) 235px, (min-width: 1001px) calc((100vw - 398px) / 3), (min-width: 761px) calc((100vw - 285px) / 3), calc(100vw - 40px)'
            : '(min-width: 1112px) 361px, (min-width: 1001px) calc((100vw - 380px) / 2), (min-width: 761px) calc((100vw - 267px) / 2), calc(100vw - 40px)',
        };
        for (const [key, value] of Object.entries(properties)) ctx.setProperty(image, key, value);
      }
    },
  },
};
