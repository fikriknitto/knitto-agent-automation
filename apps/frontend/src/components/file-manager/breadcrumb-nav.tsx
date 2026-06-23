import { splitPath } from "../../lib/file-utils";

type BreadcrumbNavProps = {
  path: string;
  onNavigate: (path: string) => void;
};

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  const segments = splitPath(path);

  return (
    <nav className="file-manager-breadcrumb" aria-label="Lokasi folder">
      <button
        type="button"
        className="file-manager-breadcrumb-item"
        onClick={() => onNavigate("")}
      >
        My Files
      </button>
      {segments.map((segment, index) => {
        const segmentPath = segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        return (
          <span key={segmentPath} className="file-manager-breadcrumb-segment">
            <span className="file-manager-breadcrumb-sep" aria-hidden="true">
              /
            </span>
            {isLast ? (
              <span className="file-manager-breadcrumb-current">{segment}</span>
            ) : (
              <button
                type="button"
                className="file-manager-breadcrumb-item"
                onClick={() => onNavigate(segmentPath)}
              >
                {segment}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
