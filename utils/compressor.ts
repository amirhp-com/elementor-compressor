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

  const clean = (val: any, parentKey?: string, isTopLevel: boolean = false, forceInner: boolean = false): any => {
    if (Array.isArray(val)) {
      return val.map(item => clean(item, parentKey, isTopLevel, forceInner)).filter(item => {
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
      
      let isThisSectionHolder = false;
      if (isTopLevel && isContainer && val.isInner === false && !sectionHolderFound) {
        isThisSectionHolder = true;
        sectionHolderFound = true;
      }

      const actingAsInner = forceInner || (isContainer && !isThisSectionHolder);

      for (const key in val) {
        let value = val[key];
        
        if (options.removeMotionFX && key.startsWith('motion_fx_')) {
          removedCount++;
          continue;
        }

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

        let childForceInner = forceInner;
        if (isThisSectionHolder && (key === 'elements' || key === 'settings')) {
          childForceInner = true;
        }

        if (key === 'isInner' && isContainer && actingAsInner) {
          cleanedObj[key] = true;
          continue;
        }

        let cleanedValue = clean(value, key, false, childForceInner);

        if (isContainer && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
          // REMOVE MARGINS COMPLETELY for both Mother and Level 2
          delete cleanedValue['margin'];
          delete cleanedValue['margin_tablet'];
          delete cleanedValue['margin_mobile'];

          if (isThisSectionHolder) {
            // Mother Section Holder
            cleanedValue['content_width'] = 'full';
            cleanedValue['width'] = { unit: "%", size: 100, sizes: [] };
            
            // Apply Padding if checked
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
          } else if (actingAsInner) {
            // Level 2+ Container
            cleanedValue['content_width'] = 'boxed';
            delete cleanedValue['width'];
            delete cleanedValue['width_tablet'];
            delete cleanedValue['width_mobile'];
            
            // Apply Padding if checked
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

      if (isContainer && actingAsInner && !('isInner' in cleanedObj)) {
        cleanedObj['isInner'] = true;
      }

      if (shouldAddFlexAlign) {
        cleanedObj['_flex_align_self'] = 'flex-start';
      }

      return cleanedObj;
    }

    return val;
  };

  return {
    cleaned: clean(obj, undefined, true, false),
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