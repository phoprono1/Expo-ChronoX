export const stripHtmlTags = (html) => {
  return html.replace(/<[^>]*>?/g, '');
};