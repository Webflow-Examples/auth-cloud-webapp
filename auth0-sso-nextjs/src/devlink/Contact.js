"use client";
import React from "react";
import * as _Builtin from "./_Builtin";
import * as _utils from "./utils";
import _styles from "./Contact.module.css";

export function Contact({ as: _Component = _Builtin.Block }) {
  return (
    <_Component
      className={_utils.cx(_styles, "section", "cc-contact")}
      tag="div"
    >
      <_Builtin.Block className={_utils.cx(_styles, "container")} tag="div">
        <_Builtin.Block className={_utils.cx(_styles, "contact")} tag="div">
          <_Builtin.Block
            className={_utils.cx(_styles, "contact-headline")}
            tag="div"
          >
            <_Builtin.Heading className={_utils.cx(_styles, "")} tag="h3">
              {"Want to get in touch?"}
              <br />
              {"Drop me a line!"}
            </_Builtin.Heading>
            <_Builtin.Paragraph
              className={_utils.cx(_styles, "paragraph-light")}
            >
              {"Lorem ipsum dolor sit amet, consectetur adipiscing elit. "}
            </_Builtin.Paragraph>
          </_Builtin.Block>
          <_Builtin.Block
            className={_utils.cx(_styles, "contact-form-wrap")}
            tag="div"
          >
            <_Builtin.FormWrapper>
              <_Builtin.FormForm
                className={_utils.cx(_styles, "contact-form")}
                name="wf-form-Email-Form"
                data-name="Email Form"
                method="get"
                id="wf-form-Email-Form"
              >
                <_Builtin.Grid
                  className={_utils.cx(_styles, "contact-form-grid")}
                  tag="div"
                >
                  <_Builtin.Block
                    id={_utils.cx(
                      _styles,
                      "w-node-d783a17e-0b35-a13a-0448-a852d0df4a32-d0df4a24"
                    )}
                    tag="div"
                  >
                    <_Builtin.FormBlockLabel htmlFor="Name-3">
                      {"Name"}
                    </_Builtin.FormBlockLabel>
                    <_Builtin.FormTextInput
                      className={_utils.cx(_styles, "text-field")}
                      name="Name"
                      data-name="Name"
                      type="text"
                      maxLength={256}
                      autoFocus={false}
                      disabled={false}
                      placeholder="Enter your name"
                      required={false}
                      id="Name"
                    />
                  </_Builtin.Block>
                  <_Builtin.Block
                    id={_utils.cx(
                      _styles,
                      "w-node-d783a17e-0b35-a13a-0448-a852d0df4a36-d0df4a24"
                    )}
                    tag="div"
                  >
                    <_Builtin.FormBlockLabel htmlFor="Email-3">
                      {"Email Address"}
                    </_Builtin.FormBlockLabel>
                    <_Builtin.FormTextInput
                      className={_utils.cx(_styles, "text-field")}
                      autoFocus={false}
                      maxLength={256}
                      name="Email"
                      data-name="Email"
                      placeholder="Enter your email"
                      type="email"
                      disabled={false}
                      required={true}
                      id="Email"
                    />
                  </_Builtin.Block>
                  <_Builtin.Block
                    id={_utils.cx(
                      _styles,
                      "w-node-d783a17e-0b35-a13a-0448-a852d0df4a3a-d0df4a24"
                    )}
                    tag="div"
                  >
                    <_Builtin.FormBlockLabel htmlFor="Message">
                      {"Form Label"}
                    </_Builtin.FormBlockLabel>
                    <_Builtin.FormTextarea
                      className={_utils.cx(
                        _styles,
                        "text-field",
                        "cc-textarea"
                      )}
                      name="Message"
                      placeholder="Enter your message"
                      maxLength={5000}
                      data-name="Message"
                      required={false}
                      autoFocus={false}
                      id="Message"
                    />
                  </_Builtin.Block>
                </_Builtin.Grid>
                <_Builtin.FormButton
                  className={_utils.cx(_styles, "primary-button")}
                  type="submit"
                  value="Submit"
                  data-wait="Please wait..."
                />
              </_Builtin.FormForm>
              <_Builtin.FormSuccessMessage
                className={_utils.cx(
                  _styles,
                  "status-message",
                  "cc-success-message"
                )}
              >
                <_Builtin.Block tag="div">
                  {"Thank you! Your submission has been received!"}
                </_Builtin.Block>
              </_Builtin.FormSuccessMessage>
              <_Builtin.FormErrorMessage
                className={_utils.cx(
                  _styles,
                  "status-message",
                  "cc-error-message"
                )}
              >
                <_Builtin.Block tag="div">
                  {"Oops! Something went wrong while submitting the form."}
                </_Builtin.Block>
              </_Builtin.FormErrorMessage>
            </_Builtin.FormWrapper>
          </_Builtin.Block>
        </_Builtin.Block>
      </_Builtin.Block>
    </_Component>
  );
}
