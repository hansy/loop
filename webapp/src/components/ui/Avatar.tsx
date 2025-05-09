import React, { useMemo } from "react";
import { minidenticon } from "minidenticons";

interface Props {
  username?: string;
  saturation?: string | number;
  lightness?: string | number;
  className?: string;
  alt?: string;
}

export default function Avatar({
  username,
  saturation,
  lightness,
  alt,
  ...props
}: Props) {
  const svgURI = useMemo(
    () =>
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        minidenticon(
          String(username),
          typeof saturation === "string" ? parseFloat(saturation) : saturation,
          typeof lightness === "string" ? parseFloat(lightness) : lightness
        )
      ),
    [username, saturation, lightness]
  );

  if (!username) {
    return null;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={svgURI} alt={alt || username} {...props} />;
}
