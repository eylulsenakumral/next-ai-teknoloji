import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/kategori/:categoryName",
    Component: CategoryPage,
  },
  {
    path: "/urun/:productId",
    Component: ProductDetailPage,
  },
  {
    path: "/sepet",
    Component: CartPage,
  },
]);
