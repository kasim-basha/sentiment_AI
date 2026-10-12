export const profileImageService = {
  validateImage: (file: File): { valid: boolean; error?: string } => {
    // 1. File Type Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, and WEBP are supported.' };
    }

    // 2. File Size Validation (e.g., 5MB limit)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
      return { valid: false, error: 'File size exceeds 5MB limit.' };
    }

    return { valid: true };
  },

  uploadImage: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate first
      const validation = profileImageService.validateImage(file);
      if (!validation.valid) {
        reject(new Error(validation.error));
        return;
      }

      // Read file and convert to DataURL (Base64) to mock upload and store it locally for preview/profile persistence
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simulate network delay
        setTimeout(() => {
          if (e.target && typeof e.target.result === 'string') {
            resolve(e.target.result);
          } else {
            reject(new Error("Failed to read image file"));
          }
        }, 800);
      };

      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  }
};
