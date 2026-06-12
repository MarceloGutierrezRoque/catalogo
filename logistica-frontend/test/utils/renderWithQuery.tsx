import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, renderHook, type RenderHookOptions, type RenderOptions } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

function TestProvider({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: TestProvider, ...options })
}

function customRenderHook<Result, Props>(
  hook: (initialProps: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper">
) {
  return renderHook(hook, { wrapper: TestProvider, ...options })
}

export { customRender as render, customRenderHook as renderHook }
export { createTestQueryClient }
