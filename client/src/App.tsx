import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import MarketingHome from "./pages/MarketingHome";
import NotFound from "./pages/NotFound";
import Workspace from "./pages/Workspace";
import { Route, Switch } from "wouter";

function Router() {
  return <Switch><Route path="/" component={MarketingHome} /><Route path="/dashboard" component={Workspace} /><Route path="/app/:section" component={Workspace} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
