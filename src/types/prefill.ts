// Prefill source base interface
export interface PrefillSourceBase {
  type: 'formField' | 'global';
}

// Source: another form's field
export interface FormFieldSource extends PrefillSourceBase {
  type: 'formField';
  formId: string;      // The source form's id
  fieldName: string;   // The source field's name
  formName?: string;   // (Optional) for display
}

// Source: global (dummy for now)
export interface GlobalSource extends PrefillSourceBase {
  type: 'global';
  globalKey: string;
  label?: string;
}

// Union type for all possible sources
export type PrefillSource = FormFieldSource | GlobalSource;

// The key is the field name in the current form
export interface PrefillMapping {
  [fieldName: string]: PrefillSource | null;
} 