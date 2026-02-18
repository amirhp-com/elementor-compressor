export interface PaddingValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export interface DevicePadding {
  desktop: PaddingValues;
  tablet: PaddingValues;
  mobile: PaddingValues;
}

export interface CompressorOptions {
  rtlize: boolean;
  removeMotionFX: boolean;
  autoFormatOnPaste: boolean;
  autoConvertOnPaste: boolean;
  autoRename: boolean;
  removeMargins: boolean;
  applyMotherPadding: boolean;
  motherPadding: DevicePadding;
  applyLevel2Padding: boolean;
  level2Padding: DevicePadding;
  applyLevel3Padding: boolean;
  level3Padding: DevicePadding;
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
  onMount?: (editor: any, monaco: any) => void;
}