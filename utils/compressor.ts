import { CompressorOptions } from '../types';

/**
 * Sanitizes a string to be used as a valid HTML ID attribute.
 * Converts spaces, whitespace, dashes, and slashes to underscores and lowercases.
 */
const sanitizeToId = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[\s\-\/]+/g, '_') // Replace spaces, whitespace, dashes, slashes with underscores
    .replace(/^_+|_+$/g, '');   // Trim leading/trailing underscores
};

/**
 * Deeply cleans an Elementor JSON object based on specific optimization rules.
 */
export const compressElementorJSON = (
  obj: any, 
  options: CompressorOptions = { rtlize: false, removeMotionFX: false }
): { cleaned: any; removedCount: number } => {
  let removedCount = 0;

  // Prefixes for nodes that should be removed if RTLize is on
  const keysToRemovePrefixes = [
    "background_hover_video", 
    "background_motion_fx", 
    "background_overlay_video", 
    "background_overlay_hover", 
    "css_filters_hover", 
    "box_shadow_hover", 
    "shape_divider", 
    "sticky"
  ];

  const isRedundantElementorObject = (val: any): boolean => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const hasSize = 'size' in val;
      const hasSizes = 'sizes' in val;
      if (hasSize && hasSizes) {
        if (val.size === "" && Array.isArray(val.sizes) && val.sizes.length === 0) {
          return true;
        }
      }
      if (Object.keys(val).length === 0) return true;
    }
    return false;
  };

  const clean = (val: any, parentKey?: string): any => {
    if (Array.isArray(val)) {
      return val.map(item => clean(item, parentKey)).filter(item => {
        if (item === null || item === undefined) {
          removedCount++;
          return false;
        }
        return true;
      });
    }

    if (val !== null && typeof val === 'object') {
      const cleanedObj: any = {};
      let shouldAddFlexAlign = false;
      
      // Flags for current node type
      const isTextEditor = val.widgetType === 'text-editor';
      const isContainer = val.elType === 'container';
      const isMainContainer = isContainer && val.isInner === false;
      const isInnerContainer = isContainer && val.isInner === true;

      for (const key in val) {
        let value = val[key];
        
        // Rule: Remove nodes starting with motion_fx_ if enabled
        if (options.removeMotionFX && key.startsWith('motion_fx_')) {
          removedCount++;
          continue;
        }

        // RTLize Specific Removals
        if (options.rtlize) {
          if (key === 'uich_custom_css_field') {
            removedCount++;
            continue;
          }
          if (keysToRemovePrefixes.some(p => key.startsWith(p))) {
            removedCount++;
            continue;
          }
        }

        // Rule: Find nodes named "_element_width" and set their value to empty string
        if (key === '_element_width') {
          cleanedObj[key] = "";
          continue;
        }

        // Rule: Remove _element_custom_width and _element_custom_width_tablet, track if we should add flex-start
        if (key === '_element_custom_width' || key === '_element_custom_width_tablet') {
          shouldAddFlexAlign = true;
          removedCount++;
          continue;
        }

        // Specific check for redundant Elementor property structures (empty size/sizes)
        if (isRedundantElementorObject(value)) {
          removedCount++;
          continue;
        }

        let cleanedValue = clean(value, key);

        // --- RTLize Logic Start ---
        if (options.rtlize) {
          // Rule: Under setting node, if flex_direction is "row", change to "row-reverse"
          if (parentKey === 'settings' && key === 'flex_direction' && cleanedValue === 'row') {
            cleanedValue = 'row-reverse';
          }

          // Rule: RTLize for text-editor alignment
          if (isTextEditor && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['align'] = 'start';
          }

          // Rule: Inner container logic
          if (isInnerContainer && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['flex_size'] = 'none';
          }

          // Rule: RTLize for main containers (elType: container, isInner: false)
          if (isMainContainer && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            // Set content_width to full
            cleanedValue['content_width'] = 'full';
            
            // Set width structure
            cleanedValue['width'] = { "unit": "%", "size": "", "sizes": [] };
            
            // Set margin structure
            cleanedValue['margin'] = {
              "unit": "px",
              "isLinked": false,
              "top": "0",
              "right": "0",
              "bottom": "0",
              "left": "0"
            };

            // Force flex_direction to row-reverse
            cleanedValue['flex_direction'] = 'row-reverse';

            // Handle _element_id from _title
            if (cleanedValue['_title']) {
              cleanedValue['_element_id'] = sanitizeToId(cleanedValue['_title']);
            }
          }
        }
        // --- RTLize Logic End ---

        // Filter out useless properties
        if (cleanedValue === null || cleanedValue === undefined) {
          removedCount++;
          continue;
        }

        // Additional check: if it's an object that became empty after cleaning, skip it
        // Keep essential containers like 'settings' and 'elements' even if temporarily empty
        if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue) && Object.keys(cleanedValue).length === 0) {
          if (key !== 'settings' && key !== 'elements') {
            removedCount++;
            continue;
          }
        }

        cleanedObj[key] = cleanedValue;
      }

      // Rule: Add "_flex_align_self": "flex-start" if custom widths were removed in this block
      if (shouldAddFlexAlign) {
        cleanedObj['_flex_align_self'] = 'flex-start';
      }

      return cleanedObj;
    }

    return val;
  };

  return {
    cleaned: clean(obj),
    removedCount
  };
};

export const formatByteSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};