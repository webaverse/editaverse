import PropTypes from "prop-types";
import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../inputs/Button";
import PrimaryLink from "../inputs/PrimaryLink";
import NavBar from "../navigation/NavBar";
import {
  Filter,
  ProjectGridContainer,
  ProjectGridHeader,
  ProjectGridHeaderRow,
  SearchInput,
  Separator
} from "./ProjectGrid";
import { ProjectsContainer, ProjectsHeader, ProjectsSection } from "./ProjectsPage";

export default function CreateProjectPage({ history, location }) {
  const queryParams = new URLSearchParams(location.search);

  const [params, setParams] = useState({
    source: "scene_listings",
    filter: queryParams.get("filter") || "featured-remixable",
    q: queryParams.get("q") || ""
  });

  const updateParams = useCallback(
    nextParams => {
      const search = new URLSearchParams();

      for (const name in nextParams) {
        if (name === "source" || !nextParams[name]) {
          continue;
        }

        search.set(name, nextParams[name]);
      }

      history.push(`/projects/create?${search}`);

      setParams(nextParams);
    },
    [history]
  );

  const onChangeQuery = useCallback(
    value => {
      updateParams({
        source: "scene_listings",
        filter: "remixable",
        q: value
      });
    },
    [updateParams]
  );

  const onSetFeaturedRemixable = useCallback(() => {
    updateParams({
      ...params,
      filter: "featured-remixable",
      q: ""
    });
  }, [updateParams, params]);

  const onSetAll = useCallback(() => {
    updateParams({
      ...params,
      filter: "remixable",
      q: ""
    });
  }, [updateParams, params]);

  return (
    <>
      <NavBar />
      <main>
        <ProjectsSection>
          <ProjectsContainer>
            <ProjectsHeader>
              <h1>New Project</h1>
              <PrimaryLink to="/projects">Back to projects</PrimaryLink>
            </ProjectsHeader>
            <ProjectGridContainer>
              <ProjectGridHeader>
                <ProjectGridHeaderRow>
                  <Filter onClick={onSetFeaturedRemixable} active={params.filter === "featured-remixable"}>
                    Featured
                  </Filter>
                  <Filter onClick={onSetAll} active={params.filter === "remixable"}>
                    All
                  </Filter>
                  <Separator />
                  <SearchInput placeholder="Search scenes..." value={params.q} onChange={onChangeQuery} />
                </ProjectGridHeaderRow>
                <ProjectGridHeaderRow>
                  <Button as={Link} to="/projects/new">
                    New Empty Project
                  </Button>
                </ProjectGridHeaderRow>
              </ProjectGridHeader>
              {/*
              <ProjectGridContent>
                <ScrollToTop />
                {error && <ErrorMessage>{error.message}</ErrorMessage>}
                {!error && (
                  <InfiniteScroll
                    initialLoad={false}
                    pageStart={0}
                    loadMore={loadMore}
                    hasMore={hasMore}
                    threshold={100}
                    useWindow={true}
                  >
                    <ProjectGrid
                      projects={filteredEntries}
                      newProjectPath="/projects/new"
                      newProjectLabel="New Empty Project"
                      onSelectProject={onSelectScene}
                      loading={loading}
                    />
                  </InfiniteScroll>
                )}
              </ProjectGridContent>
*/}
            </ProjectGridContainer>
          </ProjectsContainer>
        </ProjectsSection>
      </main>
    </>
  );
}

CreateProjectPage.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};
