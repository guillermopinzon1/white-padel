import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CategoryManagement from "./pages/CategoryManagement";
import GroupsManagement from "./pages/GroupsManagement";
import MatchesManagement from "./pages/MatchesManagement";
import TournamentManager from "./pages/TournamentManager";
import MatchesTable from "./pages/MatchesTable";
import Standings from "./pages/Standings";
import Brackets from "./pages/Brackets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/category/:categoryId" element={<CategoryManagement />} />
          <Route path="/tournament" element={<TournamentManager />} />
          <Route path="/matches-table" element={<MatchesTable />} />
          <Route path="/groups" element={<GroupsManagement />} />
          <Route path="/matches" element={<MatchesManagement />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/brackets" element={<Brackets />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
