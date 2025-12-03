export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
}

export interface ContactDetail {
  type: 'phone' | 'email' | 'address';
  value: string;
  label?: string;
}