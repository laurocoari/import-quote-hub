import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import ImporterDashboard from "./pages/importer/Dashboard";
import Products from "./pages/importer/Products";
import ProductForm from "./pages/importer/ProductForm";
import ProductDetail from "./pages/importer/ProductDetail";
import QuoteRequests from "./pages/importer/QuoteRequests";
import QuoteRequestForm from "./pages/importer/QuoteRequestForm";
import QuoteRequestDetail from "./pages/importer/QuoteRequestDetail";
import CostSimulation from "./pages/importer/CostSimulation";
import ExporterDashboard from "./pages/exporter/Dashboard";
import ExporterQuoteRequests from "./pages/exporter/QuoteRequests";
import ExporterQuoteRequestDetail from "./pages/exporter/QuoteRequestDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Importer routes */}
            <Route path="/importer/dashboard" element={<ImporterDashboard />} />
            <Route path="/importer/products" element={<Products />} />
            <Route path="/importer/products/new" element={<ProductForm />} />
            <Route path="/importer/products/:id" element={<ProductDetail />} />
            <Route path="/importer/products/:id/edit" element={<ProductForm />} />
            <Route path="/importer/quote-requests" element={<QuoteRequests />} />
            <Route path="/importer/quote-requests/new" element={<QuoteRequestForm />} />
            <Route path="/importer/quote-requests/:id" element={<QuoteRequestDetail />} />
            <Route path="/importer/quotes/:quoteId/simulate" element={<CostSimulation />} />
            
            {/* Exporter routes */}
            <Route path="/exporter/dashboard" element={<ExporterDashboard />} />
            <Route path="/exporter/quote-requests" element={<ExporterQuoteRequests />} />
            <Route path="/exporter/quote-requests/:id" element={<ExporterQuoteRequestDetail />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
