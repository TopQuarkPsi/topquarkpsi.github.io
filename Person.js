class SecQ {
  constructor() {
    this.qs = [];
    this.qs.push(" your favourite colour?");
    this.qs.push(" the name of your nemesis?");
    this.qs.push(" your paternal Grandmothers' maiden name?");
    this.qs.push(" the destination of your favourite holiday?");
    this.qs.push(" your first pets' name?");
    this.qs.push(" your first romantic partner's name?");
    this.a1 = {q: 6, a: ""};
    this.a2 = {q: 6, a: ""};
  }
  getQ() {
    return this.qs;
  }
  setA(n, str) {
    if (this.a1.q == 6) {
      this.a1 = {q: n, a: str};
      return 0;
    } else if (this.a2.q == 6) {
      this.a2 = {q: n, a: str};
      return 0;
    } 
    return 1;
  }
};

class Person {
  constructor() {
    this.name = "";
    this.time = Date();
    this.pwd = "";
    this.eml = "";
    this.tel = 0;
    this.score = 0;
    this.motto = "";
    this.status = 0;
    this.sqa = new SecQ();
  }
  setNme(name) { this.name = name; }
  setEml(eml) { this.eml = eml; }
  setPwd(pwd) { this.pwd = pwd; }
  setTel(tel) { this.tel = tel; }
  setAddScore(s) { this.score += s; }
  setMotto(m) { this.motto = m; }
  setStatus(s) { this.status = s; }
  setQA(n, str) { this.sqa.setA(n, str); }
  destroy() {}
};

export { SecQ, Person };
