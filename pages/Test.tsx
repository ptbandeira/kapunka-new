import React from 'react';

export default function Test(props) {
  return (
    <div data-sb-object-id={props['data-sb-object-id']} style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 data-sb-field-path="title">
        {props.title}
      </h1>
      <p>If you can see this page and the 'Editing' button is active, the basic setup is working.</p>
    </div>
  );
}
