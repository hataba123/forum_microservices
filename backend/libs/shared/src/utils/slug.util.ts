// Utility functions cho slug generation
export class SlugUtil {
  // Tạo slug từ string
  static createSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Normalize Vietnamese characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[đĐ]/g, 'd') // Replace đ/Đ with d
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove multiple hyphens
  }

  // Tạo unique slug với ID
  static createUniqueSlug(text: string, id?: string): string {
    const baseSlug = this.createSlug(text);
    return id ? `${baseSlug}-${id}` : baseSlug;
  }

  // Validate slug format
  static isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug) && !slug.startsWith('-') && !slug.endsWith('-');
  }

  // Extract ID from slug
  static extractIdFromSlug(slug: string): string | null {
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];
    
    // Check if last part is a valid ID (assuming CUID format)
    if (lastPart && lastPart.length >= 20) {
      return lastPart;
    }
    
    return null;
  }
}
