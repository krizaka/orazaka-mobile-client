import type { InterceptorPolicy } from "@krizaka/orazaka-shared";

/** Demo policy rows for the governance console (BFF wiring pending). */
export const MOCK_POLICIES: InterceptorPolicy[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    interceptorName: "UserContextResolver",
    executionOrder: 1,
    enabled: true,
    predicates: [],
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    interceptorName: "SystemContextInjector",
    executionOrder: 2,
    enabled: true,
    predicates: [],
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    interceptorName: "LanguageAlignmentInterceptor",
    executionOrder: 3,
    enabled: true,
    predicates: [],
  },
  {
    id: "d4e5f6a7-b8c9-0123-def0-234567890123",
    interceptorName: "MemoryInterceptor",
    executionOrder: 5,
    enabled: true,
    predicates: [{ field: "context.memoryEnabled", operator: "EQUALS", value: "true" }],
  },
  {
    id: "e5f6a7b8-c9d0-1234-ef01-345678901234",
    interceptorName: "CostShieldInterceptor",
    executionOrder: 9,
    enabled: true,
    predicates: [{ field: "context.budgetRemaining", operator: "LESS_THAN", value: "0.50" }],
  },
  {
    id: "f6a7b8c9-d0e1-2345-f012-456789012345",
    interceptorName: "ClosedLoopValidationInterceptor",
    executionOrder: 99,
    enabled: false,
    predicates: [],
  },
];
