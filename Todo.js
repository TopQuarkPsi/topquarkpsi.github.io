class Todo {
  constructor(now, whenD, whenT, what) {
    this.now = now;
    this.whenDate = whenD;
    this.whenTime = whenT;
    this.what = what;
    this.notes = "";
    this.iscomp = false;
    this.isdel = false;
    this.wellbeing = 1;   // prime-coded categories if desired 3-Connect, 5-Learn, 7-Exercise, 11-Notice, 13-Give
    this.moodval = 0;     // -3..+3
    this.moodsev = 0;     // 0..7
    this.urgency = 0;
    this.ismod = 0;
  }
};

export { Todo };
