type DownloadDebugJsonOptions = {
  data: unknown;
  fileNamePrefix: string;
};

const createDebugJson = (data: unknown): string => {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    data,
    (_key, value: unknown) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }

      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }

      return value;
    },
    2,
  );
};

export const downloadDebugJson = ({ data, fileNamePrefix }: DownloadDebugJsonOptions): void => {
  const dataBlob = new Blob([createDebugJson(data)], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

  link.href = url;
  link.download = `${fileNamePrefix}-${timestamp}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
