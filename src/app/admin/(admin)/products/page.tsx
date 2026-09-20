import { getProductsAdmin, getCategoriesAdmin } from '@/lib/admin-actions';
import ProductList from './ProductList';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    action?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  const categoryId = params.category || '';
  const status = params.status || '';
  const sort = params.sort || 'updated';
  const action = params.action;

  const categories = await getCategoriesAdmin();
  const { products, total, totalPages } = await getProductsAdmin({
    page,
    search,
    categoryId,
    status,
    sort,
  });

  return <ProductList
    products={products}
    categories={categories}
    total={total}
    page={page}
    totalPages={totalPages}
    search={search}
    categoryId={categoryId}
    status={status}
    sort={sort}
    action={action}
  />;
}
