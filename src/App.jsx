import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./pages/components/Sidebar";
import NewRoutes from "./pages/routes/NewRoutes";
import Login from "./pages/onboarding/Login";
import { Toaster } from "react-hot-toast";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Sidebar />}>
            {NewRoutes?.map(({ path, element, children }) => (
              <Route key={path} path={path} element={element}>
                {children?.map((c, idx) => (
                  <Route
                    key={idx}
                    index={c.index}
                    path={c.path}
                    element={c.element}
                  />
                ))}
              </Route>
            ))}
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
