import { logoUrl } from "../../config/assets";

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <img src={logoUrl} alt="" />
    </span>
  );
}
