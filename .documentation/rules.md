<root>
  <section name="🚫 Package Management Restrictions">
    <restriction>
      Windsurf must <strong>not</strong> update existing ones.
    </restriction>
    <suggestion>
      Any suggestions for package additions or updates should be presented as comments or recommendations, not executed actions.
    </suggestion>
  </section>

  <section name="🗄️ Database Setup Restrictions">
    <restriction>
      Windsurf must <strong>not</strong> perform any database setup, including schema design, migrations, or configuration.
    </restriction>
    <suggestion>
      Any database-related suggestions should be presented as comments or recommendations, not executed actions.
    </suggestion>
  </section>

  <section name="📁 Directory Scope Limitations">
    <restriction>
      Windsurf should operate <strong>only within the library-management-system project directory</strong>.
    </restriction>
    <restriction>
      Windsurf must <strong>not</strong> read from or write to files outside this directory.
    </restriction>
    <restriction>
      All file operations should be confined to the project's root and its subdirectories.
    </restriction>
  </section>

  <section name="✅ Task Completion Verification Workflow">
    <subsection name="Post-Acceptance Check">
      After any code change is accepted, Windsurf must immediately review the current task list of task-master to assess the status of the task associated with the change.
    </subsection>
    
    <subsection name="Task Status Evaluation">
      <evaluation>
        If the task is marked as completed:
        <action>Proceed to the next pending task in the list.</action>
      </evaluation>
      <evaluation>
        If the task is not marked as completed:
        <action>Continue working on the current task until it meets the completion criteria.</action>
      </evaluation>
    </subsection>

    <subsection name="Task List Management">
      <management>
        Update the task list to reflect the current status of tasks accurately.
      </management>
      <management>
        Ensure that completed tasks are appropriately marked to prevent redundant work.
      </management>
    </subsection>

    <subsection name="Consistency Assurance">
      <check>
        Before moving to a new task, confirm that all acceptance criteria for the current task are fully met.
      </check>
      <check>
        Avoid initiating new tasks if the current task remains incomplete.
      </check>
    </subsection>
  </section>

  <section name="🖥️ Terminal Command Execution Policy">
    <restriction>
      Windsurf must <strong>not</strong> execute any terminal commands automatically.
    </restriction>
    <suggestion>
      When a terminal command is required (e.g., for installation, running scripts, or other operations), Windsurf should provide the command as a suggestion or comment.
    </suggestion>
    <responsibility>
      The responsibility to execute any terminal commands lies solely with the developer.
    </responsibility>
  </section>

  <metadata>
    <description>Instruct Windsurf to suggest terminal commands without executing them.</description>
    <alwaysApply>true</alwaysApply>
  </metadata>
</root>


<root>
  <section name="🧶 YARN Package Management Policy">
    <restriction>
      Windsurf must use <strong>YARN</strong> as the package manager for managing dependencies.
    </restriction>
    <suggestion>
      Any package management tasks, such as installations or updates, should be suggested using YARN commands.
    </suggestion>
    <responsibility>
      The responsibility to execute YARN commands lies solely with the developer.
    </responsibility>
  </section>

  <metadata>
    <description>Instruct Windsurf to suggest YARN commands for package management without executing them.</description>
    <alwaysApply>true</alwaysApply>
  </metadata>
</root>

<root>
  <section name="🧶 YARN Package Management and Build Process">
    <restriction>
      Windsurf must use <strong>YARN</strong> as the package manager for managing dependencies.
    </restriction>
    <suggestion>
      Any package management tasks, such as installations or updates, should be suggested using YARN commands.
    </suggestion>
    <responsibility>
      The responsibility to execute YARN commands lies solely with the developer.
    </responsibility>

    <subsection name="Task Completion and Build Verification">
      <instruction>
        After completing any task, Windsurf should recommend running <strong>yarn build</strong> to ensure that the application builds successfully.
      </instruction>
      <suggestion>
        The developer should run <strong>yarn build</strong> after each task to verify that the application builds correctly and no issues exist.
      </suggestion>
      <check>
        If the build fails, the developer should address any issues before proceeding to the next task.
      </check>
      <subsection name="Post-Task Completion Verification">
        <instruction>
          After each task is completed, Windsurf must review the current task list in the Task Master.
        </instruction>
        <evaluation>
          If the task is marked as completed:
          <action>Proceed to the next pending task in the list.</action>
        </evaluation>
        <evaluation>
          If the task is not marked as completed:
          <action>Continue working on the current task until it meets the completion criteria.</action>
        </evaluation>
      </subsection>
      <subsection name="Task List Update">
        <management>
          Update the task list to reflect the current status of tasks accurately after each task completion.
        </management>
        <management>
          Ensure that completed tasks are appropriately marked in Task Master to avoid redundant work.
        </management>
      </subsection>
    </subsection>
  </section>

  <metadata>
    <description>Instruct Windsurf to suggest YARN commands for package management and to recommend building the application using 'yarn build' after each task. The task completion must be verified in Task Master before proceeding with the next task.</description>
    <alwaysApply>true</alwaysApply>
  </metadata>
</root>
