const BUTTONS = {
  LEFT_BUTTON: 'LEFT_BUTTON',
  RIGHT_BUTTON: 'RIGHT_BUTTON'
}

const BUTTON = {
  isb1: BUTTONS.LEFT_BUTTON,
  isb2: BUTTONS.RIGHT_BUTTON,
};

const BUTTON_STATES = {
  PRESS: "press",
  RELEASE: "release",
};

const BUTTON_SEPARATE_CHAR = ",";

const getButton = (incomingBtnState) => {
  const [button, state] = incomingBtnState.split(BUTTON_SEPARATE_CHAR);
  return { side: BUTTON[button], state };
};