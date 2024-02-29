export const isRequiredAttributeValueEmpty = (
  value?: string | number | number[] | null,
) => {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && (value as number[]).length === 0)
  );
};
