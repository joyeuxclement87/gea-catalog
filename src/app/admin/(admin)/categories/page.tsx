import { getCategoriesAdmin } from '@/lib/admin-actions';
import CategoryList from './CategoryList';

export default async function CategoriesPage() {
  const categories = await getCategoriesAdmin();
  return <CategoryList categories={categories} />;
}