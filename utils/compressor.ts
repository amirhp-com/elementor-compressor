import { CompressorOptions } from '../types';

/**
 * Deeply cleans an Elementor JSON object based on specific optimization rules.
 */
export const compressElementorJSON = (
  obj: any, 
  options: CompressorOptions = { rtlize: false, removeMotionFX: false }
): { cleaned: any; removedCount: number } => {
  let removedCount = 0;

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
      
      // Determine if this is a widget and if it's a text-editor
      const isTextEditor = val.widgetType === 'text-editor';

      for (const key in val) {
        let value = val[key];
        
        // Rule: Remove nodes starting with motion_fx_ if enabled
        if (options.removeMotionFX && key.startsWith('motion_fx_')) {
          removedCount++;
          continue;
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

        // Rule: RTLize - Under setting node, if flex_direction is "row", change to "row-reverse"
        if (options.rtlize && parentKey === 'settings' && key === 'flex_direction' && cleanedValue === 'row') {
          cleanedValue = 'row-reverse';
        }

        // Rule: RTLize for text-editor alignment
        // If we are currently processing the "settings" key of a "text-editor" widget
        if (options.rtlize && isTextEditor && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
          cleanedValue['align'] = 'start';
        }

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