class Symptom {
  constructor(now, whenD, whenT, what) {
    this.now = now;
    this.whenDate = whenD;
    this.whenTime = whenT;
    this.what = what;
    this.notes = "";
    this.isdel = false;
    this.severity = 0;   // 0..7
    this.duration = 0;   // minutes or hours
    this.impact = 0;     // optional impact score
    this.ismod = 0;
  }
};

export { Symptom };
