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
  
  // Hierarchy Counters
  let sectionCounter = 0;
  let globalInnerCounter = 0;

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
   * @param containerLevel depth (1: Section, 2: Container, 3+: Inner)
   * @param context persistent counters for child numbering
   */
  const clean = (
    val: any, 
    parentKey?: string, 
    containerLevel: number = 0, 
    context: { sectionIdx?: number; l2Idx?: number } = {}
  ): any => {
    if (Array.isArray(val)) {
      let currentSectionL2Counter = 0;
      return val.map((item) => {
        const isElement = item && typeof item === 'object' && item.elType;
        let passContext = { ...context };
        
        // If we are looking at elements inside a Level 1 container, track the index of Level 2 children
        if (isElement && item.elType === 'container' && containerLevel === 1) {
          currentSectionL2Counter++;
          passContext.l2Idx = currentSectionL2Counter;
        }

        return clean(item, parentKey, containerLevel, passContext);
      }).filter(item => {
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
      
      let nextContainerLevel = containerLevel;
      let newName = "";
      let newId = "";

      if (isContainer) {
        nextContainerLevel++;
        if (options.autoRename) {
          if (nextContainerLevel === 1) {
            sectionCounter++;
            context.sectionIdx = sectionCounter;
            newName = `Section ${sectionCounter}`;
            newId = `section_${sectionCounter}`;
          } else if (nextContainerLevel === 2) {
            newName = `Container ${context.sectionIdx || 1}-${context.l2Idx || 1}`;
          } else {
            globalInnerCounter++;
            newName = `Inner ${globalInnerCounter}`;
          }
        }
      }

      for (const key in val) {
        let value = val[key];
        
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

        let cleanedValue = clean(value, key, nextContainerLevel, context);

        // --- Container Settings Adjustments ---
        if (isContainer && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
          
          // Naming logic
          if (options.autoRename && newName) {
            cleanedValue['_title'] = newName;
            if (newId) cleanedValue['_element_id'] = newId;
          }

          // Independent Margin logic
          if (options.removeMargins) {
            delete cleanedValue['margin'];
            delete cleanedValue['margin_tablet'];
            delete cleanedValue['margin_mobile'];
          }

          if (nextContainerLevel === 1) {
            // Level 1: Section - Full Width
            cleanedValue['content_width'] = 'full';
            cleanedValue['width'] = { unit: "%", size: 100, sizes: [] };
            
            if (options.applyMotherPadding) {
              cleanedValue['padding'] = mapPaddingToElementor(options.motherPadding.desktop);
              cleanedValue['padding_tablet'] = mapPaddingToElementor(options.motherPadding.tablet);
              cleanedValue['padding_mobile'] = mapPaddingToElementor(options.motherPadding.mobile);
            }

            if (options.rtlize) {
              cleanedValue['flex_direction'] = 'row-reverse';
              if (!options.autoRename && cleanedValue['_title'] && !cleanedValue['_element_id']) {
                cleanedValue['_element_id'] = sanitizeToId(cleanedValue['_title']);
              }
            }
          } else if (nextContainerLevel === 2) {
            // Level 2: Boxed, stripped widths
            cleanedValue['content_width'] = 'boxed';
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
              if (cleanedValue['flex_direction'] === 'row') cleanedValue['flex_direction'] = 'row-reverse';
            }
          } else {
            // Level 3+: Inner
            cleanedValue['content_width'] = 'boxed';
            delete cleanedValue['width'];
            delete cleanedValue['width_tablet'];
            delete cleanedValue['width_mobile'];

            if (options.applyLevel3Padding) {
              cleanedValue['padding'] = mapPaddingToElementor(options.level3Padding.desktop);
              cleanedValue['padding_tablet'] = mapPaddingToElementor(options.level3Padding.tablet);
              cleanedValue['padding_mobile'] = mapPaddingToElementor(options.level3Padding.mobile);
            }

            if (options.rtlize && cleanedValue['flex_direction'] === 'row') {
              cleanedValue['flex_direction'] = 'row-reverse';
            }
          }
        }

        // isInner flag logic
        if (key === 'isInner' && isContainer) {
          cleanedValue = (nextContainerLevel !== 1);
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

      if (isContainer && !('isInner' in cleanedObj)) {
        cleanedObj['isInner'] = (nextContainerLevel !== 1);
      }

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