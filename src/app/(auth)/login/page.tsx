import { Suspense } from "react"
import { LoginForm } from "./login-form"
import { LoginMarketingPanel } from "./login-marketing-panel"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm>
        <LoginMarketingPanel />
      </LoginForm>
    </Suspense>
  )
}
