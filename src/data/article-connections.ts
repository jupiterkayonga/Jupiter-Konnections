// Intentional reading paths: a guide, its journey, or closely related work.
export const relatedArticles: Record<string, string[]> = {
  'climbing-mount-kilimanjaro': ['kilimanjaro-full-moon-climb', 'the-ultimate-zanzibar-travel-guide', 'travel-to-zanzibar'],
  'kilimanjaro-full-moon-climb': ['climbing-mount-kilimanjaro', 'travel-to-zanzibar', 'the-ultimate-zanzibar-travel-guide'],
  'the-ultimate-zanzibar-travel-guide': ['travel-to-zanzibar', 'kilimanjaro-full-moon-climb', 'climbing-mount-kilimanjaro'],
  'travel-to-zanzibar': ['the-ultimate-zanzibar-travel-guide', 'kilimanjaro-full-moon-climb', 'climbing-mount-kilimanjaro'],
  'kumbh-mela': ['festivals-from-india-my-journey-in-traditions-and-celebrations', 'rajasthan-travel', '10-things-to-do-in-jaipur'],
  'festivals-from-india-my-journey-in-traditions-and-celebrations': ['kumbh-mela', 'rajasthan-travel', '10-things-to-do-in-jaipur'],
  'rajasthan-travel': ['10-things-to-do-in-jaipur', 'festivals-from-india-my-journey-in-traditions-and-celebrations', 'kumbh-mela'],
  '10-things-to-do-in-jaipur': ['rajasthan-travel', 'festivals-from-india-my-journey-in-traditions-and-celebrations', 'kumbh-mela'],
  'todo-bien-en-habana': ['eight-days-in-cuba'],
  'eight-days-in-cuba': ['todo-bien-en-habana'],
  'portfolio/almendrones': ['portfolio/cuban-sports'],
  'portfolio/cuban-sports': ['portfolio/almendrones'],
  'portfolio/faces-of-india': ['portfolio/experiencing-holi', 'kumbh-mela'],
  'portfolio/experiencing-holi': ['portfolio/faces-of-india', 'kumbh-mela'],
  'travel-to-antarctica': ['from-rwanda-to-antarctica'],
  'from-rwanda-to-antarctica': ['travel-to-antarctica'],
  'iceland-roadtrip-top-camping-and-adventure-routes': ['travel-to-antarctica', 'the-wonders-of-the-world-a-journey-of-wonder-and-discovery'],
  'the-wonders-of-the-world-a-journey-of-wonder-and-discovery': ['rajasthan-travel', '10-things-to-do-in-jaipur', 'iceland-roadtrip-top-camping-and-adventure-routes'],
  'quarantine-diaries': ['from-rwanda-to-antarctica'],
};

// Cross-format connections appear as clearly labelled text links, separate from cards.
export const companionArticles: Record<string, string[]> = {
  'portfolio/faces-of-india': ['festivals-from-india-my-journey-in-traditions-and-celebrations'],
  'portfolio/experiencing-holi': ['festivals-from-india-my-journey-in-traditions-and-celebrations'],
  'festivals-from-india-my-journey-in-traditions-and-celebrations': ['portfolio/experiencing-holi', 'portfolio/faces-of-india'],
  'kumbh-mela': ['portfolio/faces-of-india'],
};
