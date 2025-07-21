"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./Footer.module.css";

export function Footer({ as: _Component = _Builtin.Block }) {
  return (
    <_Component className={_utils.cx(_styles, "footer-wrap")} tag="div">
      <_Builtin.Block tag="div">
        <_Builtin.Link
          className={_utils.cx(_styles, "webflow-link")}
          button={false}
          block="inline"
          options={{
            href: "https://webflow.com/",
            target: "_blank",
          }}
        >
          <_Builtin.Image
            className={_utils.cx(_styles, "webflow-logo-tiny")}
            width="15"
            height="auto"
            loading="auto"
            alt=""
            src="https://cdn.prod.website-files.com/686431ad597a0e8140e9a6b2/686431ad597a0e8140e9a70e_webflow-w-small%402x.png"
          />
          <_Builtin.Block
            className={_utils.cx(_styles, "paragraph-tiny")}
            tag="div"
          >
            {"Powered by Webflow"}
          </_Builtin.Block>
        </_Builtin.Link>
      </_Builtin.Block>
      <_Builtin.Block className={_utils.cx(_styles, "footer-links")} tag="div">
        <_Builtin.Link
          className={_utils.cx(_styles, "footer-item")}
          button={false}
          block=""
          options={{
            href: "https://www.facebook.com/webflow/",
            target: "_blank",
          }}
        >
          {"Facebook"}
        </_Builtin.Link>
        <_Builtin.Link
          className={_utils.cx(_styles, "footer-item")}
          button={false}
          block=""
          options={{
            href: "https://twitter.com/webflow",
            target: "_blank",
          }}
        >
          {"Twitter"}
        </_Builtin.Link>
        <_Builtin.Link
          className={_utils.cx(_styles, "footer-item")}
          button={false}
          block=""
          options={{
            href: "https://www.instagram.com/webflowapp/",
            target: "_blank",
          }}
        >
          {"Instagram"}
        </_Builtin.Link>
      </_Builtin.Block>
    </_Component>
  );
}
