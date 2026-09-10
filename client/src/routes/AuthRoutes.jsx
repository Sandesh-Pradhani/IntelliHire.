import { Route } from 'react-router-dom'
import ROUTES from '../constants/routes'
import AuthLayout from '../components/layouts/AuthLayout'
import Login from '../pages/Login'
import Register from '../pages/Register'

function AuthRoutes() {
  return (
    <Route element={<AuthLayout />}>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
    </Route>
  )
}

export default AuthRoutes
