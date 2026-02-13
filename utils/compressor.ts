
/**
 * Deeply cleans an Elementor JSON object.
 * Rules:
 * 1. Removes objects that have an empty "size" and empty "sizes" array.
 * 2. Removes empty strings.
 * 3. Removes properties that are null or undefined.
 * 4. Recursively cleans settings and elements.
 */
export const compressElementorJSON = (obj: any): { cleaned: any; removedCount: number } => {
  let removedCount = 0;

  const isRedundantElementorObject = (val: any): boolean => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Check for the specific typography/unit pattern requested
      const hasSize = 'size' in val;
      const hasSizes = 'sizes' in val;
      if (hasSize && hasSizes) {
        if (val.size === "" && Array.isArray(val.sizes) && val.sizes.length === 0) {
          return true;
        }
      }
      
      // Check for empty objects after cleaning
      if (Object.keys(val).length === 0) return true;
    }
    return false;
  };

  const clean = (val: any): any => {
    if (Array.isArray(val)) {
      const newArr = val.map(item => clean(item)).filter(item => {
        if (item === "" || item === null || item === undefined) {
          removedCount++;
          return false;
        }
        return true;
      });
      return newArr;
    }

    if (val !== null && typeof val === 'object') {
      const cleanedObj: any = {};
      for (const key in val) {
        const value = val[key];
        
        // Specific check for redundant Elementor property structures
        if (isRedundantElementorObject(value)) {
          removedCount++;
          continue;
        }

        const cleanedValue = clean(value);

        // Filter out useless properties
        if (cleanedValue === "" || cleanedValue === null || cleanedValue === undefined) {
          removedCount++;
          continue;
        }

        // Additional check: if it's an object that became empty after cleaning, skip it
        if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue) && Object.keys(cleanedValue).length === 0) {
          // Special case: don't remove empty "settings" or "elements" as they define the structure
          if (key !== 'settings' && key !== 'elements') {
            removedCount++;
            continue;
          }
        }

        cleanedObj[key] = cleanedValue;
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
