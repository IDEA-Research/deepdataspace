export const putFile = async (uploadUrl: string, file?: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!file) reject(null);
    fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': '',
      },
      body: file,
    })
      .then((response) => {
        resolve(response);
      })
      .catch((error) => {
        console.error('Upload file error: ', uploadUrl, error);
        reject(null);
      });
  });
};
