// the attributes linking an input to its label and its error
export const inputProps = (id: string, error?: string) => ({
  id,
  "aria-invalid": Boolean(error),
  "aria-describedby": error ? `${id}-error` : undefined,
});
