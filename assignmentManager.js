// Assignment Class
class Assignment {
    // Constructor initializes name, default status, and private grade
    constructor(assignmentName) {
        this.assignmentName = assignmentName;
        this.status = "released";
        this._grade = null; // private by convention
    }

    // Sets numerical grade and updates pass/fail status
    setGrade(grade) {
        this._grade = grade;
        if (grade > 50) {
            this.status = "pass";
        } else {
            this.status = "fail";
        }
    }


    // Returns true if assignment already has a grade
    hasGrade() {
        return typeof this._grade === "number";
    }

    // Returns numeric grade
    getNumericGrade() {
        return this._grade;
    }
}

// Observer Class
class Observer {
    // Prints notifications whenever assignment status updates
    notify(student, assignmentName, status) {
        let phrase;

        switch (status) {
            case "released":
                phrase = "has been released";
                break;
            case "working":
                phrase = "is working on";
                break;
            case "submitted":
                phrase = "has submitted";
                break;
            case "final reminder":
                phrase = "has received a final reminder for";
                break;
            case "pass":
                phrase = "has passed";
                break;
            case "fail":
                phrase = "has failed";
                break;
            default:
                phrase = `has status "${status}" for`;
        }

        console.log(`Observer → ${student.fullName}, ${assignmentName} ${phrase}.`);
    }
}


// Student Class
class Student {
    // Initializes student info and storage for assignments/timers
    constructor(fullName, email, observer) {
        this.fullName = fullName;
        this.email = email;
        this.assignmentStatuses = [];
        this.overallGrade = null;
        this._observer = observer;
        this._pendingTimers = {};
    }

    // Basic info setters
    setFullName(name) {
        this.fullName = name;
    }

    setEmail(email) {
        this.email = email;
    }

    // Finds assignment object if it already exists
    _findAssignment(assignmentName) {
        return this.assignmentStatuses.find(a => a.assignmentName === assignmentName);
    }

    // Ensures assignment exists; creates if missing
    _ensureAssignment(assignmentName) {
        let a = this._findAssignment(assignmentName);
        if (!a) {
            a = new Assignment(assignmentName);
            this.assignmentStatuses.push(a);
        }
        return a;
    }

    // Notifies the observer about assignment status change
    _notifyStatus(assignment) {
        if (this._observer) {
            this._observer.notify(this, assignment.assignmentName, assignment.status);
        }
    }

    // Recalculates overall average grade
    _updateOverallGrade() {
        const graded = this.assignmentStatuses.filter(a => a.hasGrade());
        if (graded.length === 0) {
            this.overallGrade = null;
            return;
        }
        const sum = graded.reduce((acc, a) => acc + a.getNumericGrade(), 0);
        this.overallGrade = sum / graded.length;
    }

    // Adds assignment if missing, or sets grade if provided
    updateAssignmentStatus(name, grade) {
        let a = this._findAssignment(name);

        if (!a) {
            a = new Assignment(name);
            this.assignmentStatuses.push(a);
            this._notifyStatus(a);
        }

        if (typeof grade === "number") {
            a.setGrade(grade);
            this._updateOverallGrade();
            this._notifyStatus(a);
        }
    }
    // Returns average numeric grade
    getGrade() {
        this._updateOverallGrade();
        return this.overallGrade;
    }

    // Starts working waits 500ms auto submit unless reminder submits first
    startWorking(name) {
        const a = this._ensureAssignment(name);
        a.status = "working";
        this._notifyStatus(a);

        if (this._pendingTimers[name]?.workTimeout) {
            clearTimeout(this._pendingTimers[name].workTimeout);
        }

        const timer = setTimeout(() => {
            if (["working", "released", "final reminder"].includes(a.status)) {
                this.submitAssignment(name);
            }
        }, 500);

        this._pendingTimers[name] = { ...this._pendingTimers[name], workTimeout: timer };
    }

    // Submits after 500ms assigns random grade
    submitAssignment(name) {
        const a = this._ensureAssignment(name);

        if (["submitted", "pass", "fail"].includes(a.status)) return;

        a.status = "submitted";
        this._notifyStatus(a);

        const timer = setTimeout(() => {
            const grade = Math.floor(Math.random() * 101);
            a.setGrade(grade);
            this._updateOverallGrade();
            this._notifyStatus(a);
        }, 500);

        this._pendingTimers[name] = { ...this._pendingTimers[name], gradeTimeout: timer };
    }

    // For reminders: marks as "final reminder" then submits instantly
    handleReminder(name) {
        const a = this._findAssignment(name);
        if (!a) return;

        if (["submitted", "pass", "fail"].includes(a.status)) return;

        a.status = "final reminder";
        this._notifyStatus(a);

        this.submitAssignment(name);
    }
}

// ClassList Manager
class ClassList {
    constructor(observer) {
        this._observer = observer;
        this._students = [];
    }

    // Adds student to list
    addStudent(student) {
        this._students.push(student);
        console.log(`${student.fullName} has been added to the classlist.`);
    }

    // Removes student via object or name string
    removeStudent(s) {
        const name = typeof s === "string" ? s : s.fullName;
        this._students = this._students.filter(st => st.fullName !== name);
    }

    // Finds student by name
    findStudentByName(name) {
        return this._students.find(s => s.fullName === name);
    }

    // Returns student names with outstanding assignments
    findOutstandingAssignments(assignmentName) {
        const result = [];

        if (assignmentName) {
            this._students.forEach(s => {
                const a = s.assignmentStatuses.find(x => x.assignmentName === assignmentName);
                if (!a || ["released", "working", "final reminder"].includes(a.status)) {
                    result.push(s.fullName);
                }
            });
        } else {
            this._students.forEach(s => {
                if (s.assignmentStatuses.some(a => ["released", "working", "final reminder"].includes(a.status))) {
                    result.push(s.fullName);
                }
            });
        }
        return result;
    }

    // Releases all given assignments to all students in parallel
    releaseAssignmentsParallel(names) {
        const promises = names.map(name =>
            new Promise(resolve => {
                setTimeout(() => {
                    this._students.forEach(s => s.updateAssignmentStatus(name));
                    resolve();
                }, 0);
            })
        );

        return Promise.all(promises).then(() => { });
    }

    // Sends reminders, triggers final reminder, auto submission
    sendReminder(name) {
        this._students.forEach(s => s.handleReminder(name));
    }
}

// I used this for Node.js tests
if (typeof module !== "undefined") {
    module.exports = { Assignment, Observer, Student, ClassList };
}
