import OrdersTable from '@/components/OrdersTable';
import { fetchOrders } from '@/lib/api.server';

export default async function OrdersPage() {
  const orders = await fetchOrders();
  return <OrdersTable initialOrders={orders} />;
}
