import { CompressorOptions, PaddingValues } from '../types';

/**
 * Sanitizes a string to be used as a valid HTML ID attribute.
 */
const sanitizeToId = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[\s\-\/]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const mapPaddingToElementor = (p: PaddingValues) => ({
  unit: "px",
  isLinked: false,
  top: p.top || "0",
  right: p.right || "0",
  bottom: p.bottom || "0",
  left: p.left || "0"
});

/**
 * Deeply cleans an Elementor JSON object based on specific optimization rules.
 */
export const compressElementorJSON = (
  obj: any, 
  options: CompressorOptions
): { cleaned: any; removedCount: number } => {
  let removedCount = 0;
  let sectionHolderFound = false;

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

  /**
   * Recursive cleaner
   * @param val current node
   * @param parentKey key of the node in parent
   * @param isRootElementsArray whether we are iterating the top-most 'elements' array
   * @param containerLevel 0: not in container, 1: Mother, 2+: Nested
   */
  const clean = (val: any, parentKey?: string, isRootElementsArray: boolean = false, containerLevel: number = 0): any => {
    if (Array.isArray(val)) {
      return val.map(item => clean(item, parentKey, isRootElementsArray, containerLevel)).filter(item => {
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
      
      const isContainer = val.elType === 'container';
      const isTextEditor = val.widgetType === 'text-editor';
      const isIconBox = val.widgetType === 'icon-box';
      
      // Hierarchy Logic
      let currentElementLevel = containerLevel;
      let isThisMother = false;

      // Rule: The first container encountered in the root elements array is the Mother (Level 1)
      if (isRootElementsArray && isContainer && !sectionHolderFound) {
        isThisMother = true;
        sectionHolderFound = true;
        currentElementLevel = 1;
      } else if (isContainer) {
        // If it's a container and not the mother, it's Level 2 or deeper
        if (containerLevel >= 1) {
          currentElementLevel = containerLevel + 1;
        } else {
          // If for some reason we find a container outside the root elements array logic (e.g. single element paste)
          // we treat it as Mother if it's the first one.
          if (!sectionHolderFound) {
            isThisMother = true;
            sectionHolderFound = true;
            currentElementLevel = 1;
          } else {
            currentElementLevel = 2;
          }
        }
      }

      for (const key in val) {
        let value = val[key];
        
        // Basic Stripping
        if (options.removeMotionFX && key.startsWith('motion_fx_')) {
          removedCount++;
          continue;
        }

        if (options.rtlize) {
          if (key === 'uich_custom_css_field' || keysToRemovePrefixes.some(p => key.startsWith(p))) {
            removedCount++;
            continue;
          }
        }

        if (key === '_element_width') {
          cleanedObj[key] = "";
          continue;
        }

        if (key === '_element_custom_width' || key === '_element_custom_width_tablet') {
          shouldAddFlexAlign = true;
          removedCount++;
          continue;
        }

        if (isRedundantElementorObject(value)) {
          removedCount++;
          continue;
        }

        // Recurse
        // We pass isRootElementsArray=true ONLY if the current key is 'elements' AND we are at the root level of the whole object
        const nextIsRootArray = (parentKey === undefined && key === 'elements');
        let cleanedValue = clean(value, key, nextIsRootArray, currentElementLevel);

        // --- Container Specific Rules ---
        if (isContainer && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
          // Rule: Remove margins COMPLETELY for all containers (Mother and Nested)
          delete cleanedValue['margin'];
          delete cleanedValue['margin_tablet'];
          delete cleanedValue['margin_mobile'];

          if (isThisMother) {
            // Level 1: Mother Section
            cleanedValue['content_width'] = 'full';
            cleanedValue['width'] = { unit: "%", size: 100, sizes: [] };
            
            if (options.applyMotherPadding) {
              cleanedValue['padding'] = mapPaddingToElementor(options.motherPadding.desktop);
              cleanedValue['padding_tablet'] = mapPaddingToElementor(options.motherPadding.tablet);
              cleanedValue['padding_mobile'] = mapPaddingToElementor(options.motherPadding.mobile);
            }

            if (options.rtlize) {
              cleanedValue['flex_direction'] = 'row-reverse';
              if (cleanedValue['_title']) {
                cleanedValue['_element_id'] = sanitizeToId(cleanedValue['_title']);
              }
            }
          } else if (currentElementLevel >= 2) {
            // Level 2+: Nested Containers
            cleanedValue['content_width'] = 'boxed';
            
            // Rule: No width property for level 2
            delete cleanedValue['width'];
            delete cleanedValue['width_tablet'];
            delete cleanedValue['width_mobile'];
            
            if (options.applyLevel2Padding) {
              cleanedValue['padding'] = mapPaddingToElementor(options.level2Padding.desktop);
              cleanedValue['padding_tablet'] = mapPaddingToElementor(options.level2Padding.tablet);
              cleanedValue['padding_mobile'] = mapPaddingToElementor(options.level2Padding.mobile);
            }

            if (options.rtlize) {
              cleanedValue['flex_size'] = 'none';
              if (cleanedValue['flex_direction'] === 'row') {
                cleanedValue['flex_direction'] = 'row-reverse';
              }
            }
          }
        }

        // isInner Logic
        if (key === 'isInner' && isContainer) {
          if (isThisMother) {
            cleanedValue = false; // Mother is typically not an inner container (Section equivalent)
          } else {
            cleanedValue = true; // All others are inner
          }
        }

        // RTL Widget Alignments
        if (options.rtlize) {
          if (parentKey === 'settings' && key === 'flex_direction' && cleanedValue === 'row') {
             if (!isContainer) cleanedValue = 'row-reverse';
          }
          if (isTextEditor && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['align'] = 'start';
          }
          if (isIconBox && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['text_align'] = 'start';
          }
        }

        if (cleanedValue === null || cleanedValue === undefined) {
          removedCount++;
          continue;
        }

        if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue) && Object.keys(cleanedValue).length === 0) {
          if (key !== 'settings' && key !== 'elements') {
            removedCount++;
            continue;
          }
        }

        cleanedObj[key] = cleanedValue;
      }

      // Ensure isInner is set if it was missing
      if (isContainer && !('isInner' in cleanedObj)) {
        cleanedObj['isInner'] = !isThisMother;
      }

      if (shouldAddFlexAlign) {
        cleanedObj['_flex_align_self'] = 'flex-start';
      }

      return cleanedObj;
    }

    return val;
  };

  return {
    cleaned: clean(obj, undefined, false, 0),
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