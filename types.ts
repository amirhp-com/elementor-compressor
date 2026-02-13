
export interface CompressorOptions {
  rtlize: boolean;
  removeMotionFX: boolean;
}

export interface CompressorStats {
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  removedKeys: number;
}

export interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}
