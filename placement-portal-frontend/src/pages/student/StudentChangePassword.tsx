import { PasswordInput } from '../../components/ui/PasswordInput'
import './StudentProfile.css'

const StudentChangePassword = () => {
  return (
    <div className="profile-root">
      <main className="profile-main">
        <h1>Change Password</h1>
        <p className="profile-placeholder">Update your account password securely.</p>
        <form className="password-form">
          <label>
            Current Password
            <PasswordInput />
          </label>
          <label>
            New Password
            <PasswordInput />
          </label>
          <label>
            Confirm New Password
            <PasswordInput />
          </label>
          <button type="button">Save Password</button>
        </form>
      </main>
    </div>
  )
}

export default StudentChangePassword
