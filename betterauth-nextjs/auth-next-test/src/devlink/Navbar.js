"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _interactions from "./interactions";
import * as _utils from "./utils";
import _styles from "./Navbar.module.css";

const _interactionsData = JSON.parse(
  '{"events":{"e":{"id":"e","name":"","animationType":"custom","eventTypeId":"NAVBAR_OPEN","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-2"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"1fa6f97b-84f7-2db3-29cb-1275161e4330","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"1fa6f97b-84f7-2db3-29cb-1275161e4330","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1640005099190},"e-2":{"id":"e-2","name":"","animationType":"custom","eventTypeId":"NAVBAR_CLOSE","action":{"id":"","actionTypeId":"GENERAL_START_ACTION","config":{"delay":0,"easing":"","duration":0,"actionListId":"a-2","affectedElements":{},"playInReverse":false,"autoStopEventId":"e-38"}},"mediaQueries":["main","medium","small","tiny"],"target":{"id":"1fa6f97b-84f7-2db3-29cb-1275161e4330","appliesTo":"ELEMENT","styleBlockIds":[]},"targets":[{"id":"1fa6f97b-84f7-2db3-29cb-1275161e4330","appliesTo":"ELEMENT","styleBlockIds":[]}],"config":{"loop":false,"playInReverse":false,"scrollOffsetValue":null,"scrollOffsetUnit":null,"delay":null,"direction":null,"effectIn":null},"createdOn":1640005099190}},"actionLists":{"a":{"id":"a","title":"Navbar menu -> OPEN","actionItemGroups":[{"actionItems":[{"id":"a-n","actionTypeId":"STYLE_SIZE","config":{"delay":0,"easing":"inOutQuint","duration":200,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-middle","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e77"]},"widthValue":0,"widthUnit":"px","heightUnit":"PX","locked":false}},{"id":"a-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":400,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e75"]},"yValue":-8,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-n-3","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":400,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-top","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e78"]},"yValue":8,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-n-4","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":600,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-top","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e78"]},"zValue":-45,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}},{"id":"a-n-5","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":600,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e75"]},"zValue":45,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}}]}],"useFirstGroupAsInitialState":false,"createdOn":1626168378054},"a-2":{"id":"a-2","title":"Navbar menu -> CLOSE","actionItemGroups":[{"actionItems":[{"id":"a-2-n","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":600,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e75"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-2-n-2","actionTypeId":"TRANSFORM_MOVE","config":{"delay":0,"easing":"inOutQuint","duration":600,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-top","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e78"]},"yValue":0,"xUnit":"PX","yUnit":"px","zUnit":"PX"}},{"id":"a-2-n-3","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":400,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e75"]},"zValue":0,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}},{"id":"a-2-n-4","actionTypeId":"TRANSFORM_ROTATE","config":{"delay":0,"easing":"inOutQuint","duration":400,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-top","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e78"]},"zValue":0,"xUnit":"DEG","yUnit":"DEG","zUnit":"deg"}},{"id":"a-2-n-5","actionTypeId":"STYLE_SIZE","config":{"delay":400,"easing":"inOutQuint","duration":200,"target":{"useEventTarget":"CHILDREN","selector":".menu-icon-line-middle","selectorGuids":["e072d2fd-0192-e544-ee2d-d264c3915e77"]},"widthValue":24,"widthUnit":"px","heightUnit":"PX","locked":false}}]}],"useFirstGroupAsInitialState":false,"createdOn":1626168766736}},"site":{"mediaQueries":[{"key":"main","min":992,"max":10000},{"key":"medium","min":768,"max":991},{"key":"small","min":480,"max":767},{"key":"tiny","min":0,"max":479}]}}'
);

export function Navbar({
  as: _Component = _Builtin.Section,
  navbarLinkFeatures = "Features",
  navbarLinkProducts = "Products",
  navbarLinkResources = "Resources",
  navbarLinkContact = "Contact",
  buttonTextGetStarted = "Get started",
  localeDropdownSlot,
  runtimeProps,
  onClick = {},
  temperature = 45,
  weatherIcon,
}) {
  _interactions.useInteractions(_interactionsData, _styles);

  return (
    <_Component
      className={_utils.cx(_styles, "navbar")}
      grid={{
        type: "section",
      }}
      tag="section"
    >
      {weatherIcon ?? (
        <_Builtin.NavbarWrapper
          className={_utils.cx(_styles, "navbar-component")}
          data-w-id="1fa6f97b-84f7-2db3-29cb-1275161e4330"
          tag="div"
          config={{
            animation: "default",
            collapse: "medium",
            docHeight: false,
            duration: 400,
            easing: "ease",
            easing2: "ease",
            noScroll: false,
          }}
        >
          <_Builtin.Block
            className={_utils.cx(_styles, "navbar-container")}
            tag="div"
          >
            <_Builtin.NavbarBrand
              className={_utils.cx(_styles, "navbar-logo-link")}
              options={{
                href: "#",
              }}
            >
              <_Builtin.Image
                loading="lazy"
                width="auto"
                height="auto"
                role="img"
                data-caption="Astral fund logo"
                alt=""
                src="https://cdn.prod.website-files.com/6813a82d2006ad93ffe5da10/6813a82d2006ad93ffe5da74_AstralFund%20Logo.svg"
              />
            </_Builtin.NavbarBrand>
            <_Builtin.NavbarMenu
              className={_utils.cx(_styles, "navbar-menu")}
              tag="nav"
              role="navigation"
            >
              <_Builtin.Block
                className={_utils.cx(_styles, "menu-left")}
                tag="div"
              >
                <_Builtin.NavbarLink
                  className={_utils.cx(_styles, "navbar-link")}
                  options={{
                    href: "#",
                  }}
                >
                  {navbarLinkContact}
                </_Builtin.NavbarLink>
                <_Builtin.NavbarLink
                  className={_utils.cx(_styles, "navbar-link")}
                  options={{
                    href: "#",
                  }}
                >
                  {navbarLinkFeatures}
                </_Builtin.NavbarLink>
              </_Builtin.Block>
              <_Builtin.Block
                className={_utils.cx(_styles, "navbar-menu-right")}
                tag="div"
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "weather-icon")}
                  tag="div"
                />
                <_Builtin.Block
                  className={_utils.cx(_styles, "navbartext")}
                  tag="div"
                >
                  {_utils.formatNumber(temperature, -1)}
                </_Builtin.Block>
                <_Builtin.Block
                  className={_utils.cx(_styles, "navbartext")}
                  tag="div"
                >
                  {"°F"}
                </_Builtin.Block>
                <_Builtin.Block
                  className={_utils.cx(_styles, "navbar-button-wrapper")}
                  tag="div"
                >
                  <_Builtin.Link
                    className={_utils.cx(
                      _styles,
                      "button-secondary",
                      "show-tablet"
                    )}
                    button={false}
                    block="inline"
                    options={{
                      href: "#",
                    }}
                  >
                    <_Builtin.Block tag="div">{"Log in"}</_Builtin.Block>
                  </_Builtin.Link>
                </_Builtin.Block>
              </_Builtin.Block>
            </_Builtin.NavbarMenu>
            <_Builtin.NavbarButton
              className={_utils.cx(_styles, "navbar-menu-button")}
              tag="div"
            >
              <_Builtin.Block
                className={_utils.cx(_styles, "menu-icon-component")}
                tag="div"
              >
                <_Builtin.Block
                  className={_utils.cx(_styles, "menu-icon-line-top")}
                  tag="div"
                />
                <_Builtin.Block
                  className={_utils.cx(_styles, "menu-icon-line-middle")}
                  tag="div"
                >
                  <_Builtin.Block
                    className={_utils.cx(_styles, "menu-icon-middle-line")}
                    tag="div"
                  />
                </_Builtin.Block>
                <_Builtin.Block
                  className={_utils.cx(_styles, "menu-icon")}
                  tag="div"
                />
              </_Builtin.Block>
            </_Builtin.NavbarButton>
          </_Builtin.Block>
        </_Builtin.NavbarWrapper>
      )}
    </_Component>
  );
}
