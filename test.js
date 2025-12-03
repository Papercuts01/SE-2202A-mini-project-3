const { Assignment, Observer, Student, ClassList } = require("./assignmentManager");

const observer = new Observer();
const classList = new ClassList(observer);

const s1 = new Student("John Lastname", "John@uwo.ca", observer);
const s2 = new Student("Sporngle Gerfunkle", "Sporngle@uwo.ca", observer);

classList.addStudent(s1);
classList.addStudent(s2);

classList.releaseAssignmentsParallel(["A1", "A2"]).then(() => {
    s1.startWorking("A1");
    s2.startWorking("A2");

    setTimeout(() => classList.sendReminder("A1"), 200);
});