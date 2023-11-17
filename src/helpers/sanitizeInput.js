import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Sanitize inputs
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const customConfig = {
  ALLOWED_TAGS: [], // Empty array to disallow all tags
  ALLOWED_ATTR: [], // Empty array to disallow all attributes
};

// Set the custom configuration for DOMPurify
DOMPurify.setConfig(customConfig);

const sanitizeInput = (val) => {
  return DOMPurify.sanitize(val);
};

export default sanitizeInput;
