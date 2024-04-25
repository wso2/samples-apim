import { useNavigate } from "react-router-dom";
import notFoundLogo from '../assets/404.svg';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div>
        <a href="/" target="_blank">
            <img src={notFoundLogo} className="not-found" alt="Not Found" />
        </a>
    </div>
  );
}
