import React, { useContext, useEffect } from "react";
import NavBar from "../navigation/NavBar";
import {
  ProjectGrid,
  ProjectGridContainer,
  ProjectGridHeader,
  ProjectGridHeaderRow,
  ProjectGridContent,
  ErrorMessage
} from "./ProjectGrid";
import { Button } from "../inputs/Button";
import { MediumButton } from "../inputs/Button";
import { Link } from "react-router-dom";
import LatestUpdate from "../whats-new/LatestUpdate";
import { connectMenu, ContextMenu, MenuItem } from "../layout/ContextMenu";
import templates from "./templates";
import styled from "styled-components";
import { withRouter } from "react-router-dom";
import { GlobalContext } from "../contexts/GlobalState";
import { ApiContext } from "../contexts/ApiContext";

export const ProjectsSection = styled.section`
  padding-bottom: 100px;
  display: flex;
  flex: ${props => (props.flex === undefined ? 1 : props.flex)};

  &:first-child {
    padding-top: 100px;
  }

  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 16px;
  }
`;

export const ProjectsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 20px;
`;

const WelcomeContainer = styled(ProjectsContainer)`
  align-items: center;

  & > * {
    text-align: center;
  }

  & > *:not(:first-child) {
    margin-top: 20px;
  }

  h2 {
    max-width: 480px;
  }
`;

export const ProjectsHeader = styled.div`
  margin-bottom: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const contextMenuId = "project-menu";

const ProjectsPage = props => {
  const { auth, loginWithDiscord } = useContext(GlobalContext);
  const api = useContext(ApiContext);
  const isAuthenticated = api.isAuthenticated();
  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());
  const user = api.getAuth();
  const [state, setState] = React.useState({
    projects: [],
    loading: isAuthenticated,
    isAuthenticated,
    error: null,
    user: user
  });

  useEffect(() => {
    // We dont need to load projects if the user isn't logged in
    if (state.isAuthenticated) {
      /* api
        .getProjects()
        .then(projects => {
          setState({
            projects: projects.map(project => ({
              ...project,
              url: `/projects/${project.project_id}`
            })),
            loading: false
          });
        })
        .catch(error => {
          console.error(error);
          if (error.response && error.response.status === 401) {
            // User has an invalid auth token. Prompt them to login again.
            api.logout();
            // eslint-disable-next-line react/prop-types
            return props.history.push("/login", { from: "/projects" });
          }

          
        });*/
      setState({ projects: [], loading: false });
    }

    if (params.code && !auth) {
      const user = async () => await loginWithDiscord(params.code);
      user();
    }
  }, [isAuthenticated, params]);

  useEffect(() => {
    if (auth) {
      // eslint-disable-next-line react/prop-types
      props.history.push("/projects");
    }
  }, [auth]);

  const onDeleteProject = project => {
    api
      .deleteProject(project.project_id)
      .then(() => setState({ projects: state.projects.filter(p => p.project_id !== project.project_id) }))
      .catch(error => this.setState({ error }));
  };

  const renderContextMenu = props => {
    return (
      <ContextMenu id={contextMenuId}>
        <MenuItem
          onClick={e => {
            // eslint-disable-next-line react/prop-types
            onDeleteProject(props.trigger.project, e);
          }}
        >
          Delete Project
        </MenuItem>
      </ContextMenu>
    );
  };

  const ProjectContextMenu = connectMenu(contextMenuId)(renderContextMenu);

  const { error, loading, projects } = state;

  const topTemplates = [];

  for (let i = 0; i < templates.length && i < 4; i++) {
    topTemplates.push(templates[i]);
  }

  return (
    <>
      <NavBar />
      <main>
        {!isAuthenticated || (projects && !loading) ? (
          <ProjectsSection flex={0}>
            <WelcomeContainer>
              <h1>Welcome</h1>
              <h2>
                If you&#39;re new here we recommend going through the tutorial. Otherwise, jump right in and create a
                project from scratch or from one of our templates.
              </h2>
              <MediumButton as={Link} to="/projects/tutorial">
                Start Tutorial
              </MediumButton>
            </WelcomeContainer>
          </ProjectsSection>
        ) : (
          <LatestUpdate />
        )}
        <ProjectsSection>
          <ProjectsContainer>
            <ProjectsHeader>
              <h1>Projects</h1>
            </ProjectsHeader>
            <ProjectGridContainer>
              <ProjectGridHeader>
                <ProjectGridHeaderRow></ProjectGridHeaderRow>
                <ProjectGridHeaderRow>
                  <Button as={Link} to="/projects/create">
                    New Project
                  </Button>
                </ProjectGridHeaderRow>
              </ProjectGridHeader>
              <ProjectGridContent>
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
                {!error && (
                  <ProjectGrid
                    loading={loading}
                    projects={projects}
                    newProjectPath="/projects/templates"
                    contextMenuId={contextMenuId}
                  />
                )}
              </ProjectGridContent>
            </ProjectGridContainer>
          </ProjectsContainer>
        </ProjectsSection>
        <ProjectContextMenu />
      </main>
    </>
  );
};

export default withRouter(ProjectsPage);
