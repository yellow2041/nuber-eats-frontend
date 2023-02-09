import { render } from "@testing-library/react";
import React from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter as Router } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

const AllTheProviders: React.FC<Props> = ({ children }: Props) => {
  return (
    <HelmetProvider>
      <Router>{children}</Router>
    </HelmetProvider>
  );
};

const customRender = (ui: React.ReactElement, options?: any) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";

export { customRender as render };
