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
  options: CompressorOptions = { rtlize: false, removeMotionFX: false, autoFormatOnPaste: true, autoConvertOnPaste: true }
): { cleaned: any; removedCount: number } => {
  let removedCount = 0;
  let sectionHolderFound = false;

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

  /**
   * Recursive cleaner
   * @param val Value to clean
   * @param parentKey Key of the parent property
   * @param isTopLevel Whether this node is potentially a Section Holder candidate
   * @param forceInner Whether this node and its children must be treated as inner containers
   */
  const clean = (val: any, parentKey?: string, isTopLevel: boolean = false, forceInner: boolean = false): any => {
    if (Array.isArray(val)) {
      // For arrays, we clean items and filter out nulls
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
      
      // Determination of Section Holder:
      // Must be top-level (direct descendant of root), a container, isInner must be false, AND we haven't found one yet.
      let isThisSectionHolder = false;
      if (isTopLevel && isContainer && val.isInner === false && !sectionHolderFound) {
        isThisSectionHolder = true;
        sectionHolderFound = true;
      }

      // Determination of "Acting as Inner":
      // If forceInner is true OR it already says it's inner OR it's a container that isn't the primary section holder.
      const actingAsInner = forceInner || (isContainer && !isThisSectionHolder);

      for (const key in val) {
        let value = val[key];
        
        // General Removal Rules
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

        // Logic for identifying children hierarchy:
        // If this current element is the Section Holder, all its descendants should be forced as inner.
        let childForceInner = forceInner;
        if (isThisSectionHolder && (key === 'elements' || key === 'settings')) {
          childForceInner = true;
        }

        // --- Forced isInner overwrite ---
        // If this is a container and it's acting as inner, force the "isInner" property to true in the output
        if (key === 'isInner' && isContainer && actingAsInner) {
          cleanedObj[key] = true;
          continue;
        }

        let cleanedValue = clean(value, key, false, childForceInner);

        // --- RTLize Logic Start ---
        if (options.rtlize) {
          // General Row mirroring: Under setting node, if flex_direction is "row", change to "row-reverse"
          if (parentKey === 'settings' && key === 'flex_direction' && cleanedValue === 'row') {
            cleanedValue = 'row-reverse';
          }

          // Rule: RTLize for text-editor alignment
          if (isTextEditor && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['align'] = 'start';
          }

          // Rule: RTLize for icon-box alignment
          if (isIconBox && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['text_align'] = 'start';
          }

          // Rule: Inner container logic (applied to anything acting as inner)
          if (isContainer && actingAsInner && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['flex_size'] = 'none';
          }

          // Rule: SECTION HOLDER SPECIFIC Rules
          if (isThisSectionHolder && key === 'settings' && cleanedValue && typeof cleanedValue === 'object') {
            cleanedValue['content_width'] = 'full';
            cleanedValue['width'] = { "unit": "%", "size": "", "sizes": [] };
            cleanedValue['margin'] = {
              "unit": "px",
              "isLinked": false,
              "top": "0",
              "right": "0",
              "bottom": "0",
              "left": "0"
            };
            cleanedValue['flex_direction'] = 'row-reverse';
            if (cleanedValue['_title']) {
              cleanedValue['_element_id'] = sanitizeToId(cleanedValue['_title']);
            }
          }
        }
        // --- RTLize Logic End ---

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

      // If isInner key was missing but it's a container that should be forced inner, we add it.
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

  // Entry point: process as top-level
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