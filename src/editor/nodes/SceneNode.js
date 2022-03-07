import { Math as _Math, Scene, Group, Object3D, Fog, FogExp2, Color } from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import { setStaticMode, StaticModes, isStatic } from "../StaticMode";
import sortEntities from "../utils/sortEntities";
import MeshCombinationGroup from "../MeshCombinationGroup";
import GroupNode from "./GroupNode";
import getNodeWithUUID from "../utils/getNodeWithUUID";
import serializeColor from "../utils/serializeColor";
import { DistanceModelType } from "../objects/AudioSource";
import traverseFilteredSubtrees from "../utils/traverseFilteredSubtrees";

//To Kebab case
const toKebabCase = str =>
  str &&
  str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x => x.toLowerCase())
    .join("-");
// Migrate v1 spoke scene to v2
function migrateV1ToV2(json) {
  const { root, metadata, entities } = json;

  // Generate UUIDs for all existing entity names.
  const rootUUID = _Math.generateUUID();
  const nameToUUID = { [root]: rootUUID };
  for (const name in entities) {
    if (Object.prototype.hasOwnProperty.call(entities, name)) {
      nameToUUID[name] = _Math.generateUUID();
    }
  }

  // Replace names with uuids in entities and add the name property.
  const newEntities = { [rootUUID]: { name: root } };
  for (const [name, entity] of Object.entries(entities)) {
    const uuid = nameToUUID[name];
    newEntities[uuid] = Object.assign({}, entity, {
      name,
      parent: nameToUUID[entity.parent]
    });
  }

  return {
    version: 2,
    root: nameToUUID[root],
    entities: newEntities,
    metadata
  };
}

function migrateV2ToV3(json) {
  json.version = 3;

  for (const entityId in json.entities) {
    if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

    const entity = json.entities[entityId];

    if (!entity.components) {
      continue;
    }

    entity.components.push({
      name: "visible",
      props: {
        value: true
      }
    });

    const modelComponent = entity.components.find(c => c.name === "gltf-model");
    const navMeshComponent = entity.components.find(c => c.name === "nav-mesh");

    if (!navMeshComponent && modelComponent && modelComponent.props.includeInFloorPlan) {
      entity.components.push({
        name: "collidable",
        props: {}
      });

      entity.components.push({
        name: "walkable",
        props: {}
      });
    }

    const groundPlaneComponent = entity.components.find(c => c.name === "ground-plane");

    if (groundPlaneComponent) {
      entity.components.push({
        name: "walkable",
        props: {}
      });
    }

    if (modelComponent && navMeshComponent) {
      entity.components = [
        {
          name: "floor-plan",
          props: {
            autoCellSize: true,
            cellSize: 1,
            cellHeight: 0.1,
            agentHeight: 1.0,
            agentRadius: 0.0001,
            agentMaxClimb: 0.5,
            agentMaxSlope: 45,
            regionMinSize: 4
          }
        }
      ];
    }
  }

  return json;
}

function migrateV3ToV4(json) {
  json.version = 4;

  for (const entityId in json.entities) {
    if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

    const entity = json.entities[entityId];

    if (!entity.components) {
      continue;
    }

    const visibleComponent = entity.components.find(c => c.name === "visible");

    if (visibleComponent) {
      if (visibleComponent.props.visible !== undefined) {
        continue;
      }

      if (visibleComponent.props.value !== undefined) {
        visibleComponent.props = {
          visible: visibleComponent.props.value
        };
      } else {
        visibleComponent.props = {
          visible: true
        };
      }
    }
  }

  return json;
}

const combineComponents = ["gltf-model", "kit-piece"];

function migrateV4ToV5(json) {
  json.version = 5;

  for (const entityId in json.entities) {
    if (!Object.prototype.hasOwnProperty.call(json.entities, entityId)) continue;

    const entity = json.entities[entityId];

    if (!entity.components) {
      continue;
    }

    const animationComponent = entity.components.find(c => c.name === "loop-animation");

    if (animationComponent) {
      // Prior to V5 animation clips were stored in activeClipIndex as an integer
      const { activeClipIndex } = animationComponent.props;
      delete animationComponent.props.activeClipIndex;
      // In V5+ activeClipIndices stores an array of integers. It may be undefined if migrating from a legacy scene where the
      // clip property stores the animation clip name. We can't migrate this here so we do it in ModelNode and KitPieceNode.
      animationComponent.props.activeClipIndices = activeClipIndex !== undefined ? [activeClipIndex] : [];
    }

    const hasCombineComponent = entity.components.find(c => combineComponents.indexOf(c.name) !== -1);

    if (hasCombineComponent) {
      entity.components.push({
        name: "combine",
        props: {}
      });
    }
  }

  return json;
}

export const FogType = {
  Disabled: "disabled",
  Linear: "linear",
  Exponential: "exponential"
};

export default class SceneNode extends EditorNodeMixin(Scene) {
  static nodeName = "Scene";

  static disableTransform = true;

  static canAddNode() {
    return false;
  }

  static async loadProject(editor, json) {
    console.log(json);
    if (!json.version) {
      json = migrateV1ToV2(json);
    }

    if (json.version === 2) {
      json = migrateV2ToV3(json);
    }

    if (json.version === 3) {
      json = migrateV3ToV4(json);
    }

    if (json.version === 4) {
      json = migrateV4ToV5(json);
    }

    const { root, metadata, entities } = json;

    let scene = null;

    const dependencies = [];

    function loadAsync(promise) {
      dependencies.push(promise);
    }

    const errors = [];

    function onError(object, error) {
      errors.push(error);
    }

    const sortedEntities = sortEntities(entities);

    for (const entityId of sortedEntities) {
      const entity = entities[entityId];

      let EntityNodeConstructor;

      for (const NodeConstructor of editor.nodeTypes) {
        if (NodeConstructor.shouldDeserialize(entity)) {
          EntityNodeConstructor = NodeConstructor;
          break;
        }
      }

      if (!EntityNodeConstructor) {
        throw new Error(`No node constructor found for entity "${entity.name}"`);
      }

      const node = await EntityNodeConstructor.deserialize(editor, entity, loadAsync, onError);
      node.uuid = entityId;

      if (entity.parent) {
        const parent = getNodeWithUUID(scene, entity.parent);

        if (!parent) {
          throw new Error(
            `Node "${entity.name}" with uuid "${entity.uuid}" specifies parent "${entity.parent}", but was not found.`
          );
        }

        parent.children.splice(entity.index, 0, node);
        node.parent = parent;
      } else if (entityId === root) {
        scene = node;
        scene.metadata = metadata;
        // Needed so that editor.scene is set correctly when used in nodes deserialize methods.
        editor.scene = scene;
      } else {
        throw new Error(`Node "${entity.name}" with uuid "${entity.uuid}" does not specify a parent.`);
      }

      node.onChange();
    }

    await Promise.all(dependencies);

    return [scene, errors];
  }

  static scnToSpokeJson(json) {
    const { name, root, skyboxId, components } = json.objects[0].content;
    const object = {
      version: 5,
      root: root,
      metadata: { name },
      entities: {
        [skyboxId]: {
          name: "Skybox",
          components: [
            {
              name: "transform",
              props: {
                position: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                rotation: {
                  x: 0,
                  y: 0,
                  z: 0
                },
                scale: {
                  x: 1,
                  y: 1,
                  z: 1
                }
              }
            },
            {
              name: "visible",
              props: {
                visible: true
              }
            },
            {
              name: "editor-settings",
              props: {
                enabled: true
              }
            },
            {
              name: "skybox",
              props: {
                turbidity: 6.09,
                rayleigh: 0.82,
                luminance: 1.055,
                mieCoefficient: 0.043,
                mieDirectionalG: 0.8,
                inclination: 0.10471975511965978,
                azimuth: 0.2333333333333333,
                distance: 8000
              }
            }
          ],
          parent: root,
          index: 0
        }
      }
    };

    const tempFogEntity = {
      [root]: { name, components: [...components] }
    };

    object.entities = { ...tempFogEntity, ...object.entities };

    json.objects.forEach((item, index) => {
      let tmpEntity;
      if (item.content.uuid && item.type === "application/light") {
        tmpEntity = {
          [item.content.uuid]: {
            name: item.content.name,
            components: [
              {
                name: "transform",
                props: {
                  position: {
                    x: item.content.position[0],
                    y: item.content.position[1],
                    z: item.content.position[2]
                  },
                  rotation: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  scale: {
                    x: 1,
                    y: 1,
                    z: 1
                  }
                }
              },
              {
                name: "visible",
                props: {
                  visible: true
                }
              },
              {
                name: "editor-settings",
                props: {
                  enabled: true
                }
              },
              {
                name: toKebabCase(item.content.name),
                props: {
                  color: item.color ? item.color : "#ffffff",
                  intensity: 1,
                  range: 0,
                  castShadow: true,
                  shadowMapResolution: [512, 512],
                  shadowBias: 0,
                  shadowRadius: 1
                }
              }
            ],
            parent: root,
            index: index
          }
        };
      } else if (item.content.uuid) {
        tmpEntity = {
          [item.content.uuid]: {
            name: item.content.name,
            components: [
              {
                name: "transform",
                props: {
                  position: {
                    x: item.position[0],
                    y: item.position[1],
                    z: item.position[2]
                  },
                  rotation: {
                    x: 0,
                    y: 0,
                    z: 0
                  },
                  scale: {
                    x: 1,
                    y: 1,
                    z: 1
                  }
                }
              },
              {
                name: "visible",
                props: {
                  visible: true
                }
              },
              {
                name: "editor-settings",
                props: {
                  enabled: true
                }
              },
              {
                name: "gltf-model",
                props: {
                  src: item.start_url,
                  attribution: null
                }
              },
              {
                name: "shadow",
                props: {
                  cast: false,
                  receive: true
                }
              },
              {
                name: "collidable",
                props: {}
              },
              {
                name: "walkable",
                props: {}
              },
              {
                name: "combine",
                props: {}
              }
            ],
            parent: root,
            index: index
          }
        };
      }
      object.entities = { ...object.entities, ...tmpEntity };
    });

    return object;
  }

  static async loadProjectScn(editor, scnjson) {
    let json = SceneNode.scnToSpokeJson(scnjson);
    console.log("json", json);
    if (!json.version) {
      json = migrateV1ToV2(json);
    }

    if (json.version === 2) {
      json = migrateV2ToV3(json);
    }

    if (json.version === 3) {
      json = migrateV3ToV4(json);
    }

    if (json.version === 4) {
      json = migrateV4ToV5(json);
    }

    const { root, metadata, entities } = json;

    let scene = null;

    const dependencies = [];

    function loadAsync(promise) {
      dependencies.push(promise);
    }

    const errors = [];

    function onError(object, error) {
      errors.push(error);
    }

    const sortedEntities = sortEntities(entities);

    for (const entityId of sortedEntities) {
      const entity = entities[entityId];

      let EntityNodeConstructor;

      for (const NodeConstructor of editor.nodeTypes) {
        if (NodeConstructor.shouldDeserialize(entity)) {
          EntityNodeConstructor = NodeConstructor;
          break;
        }
      }

      if (!EntityNodeConstructor) {
        throw new Error(`No node constructor found for entity "${entity.name}"`);
      }

      const node = await EntityNodeConstructor.deserialize(editor, entity, loadAsync, onError);
      node.uuid = entityId;

      if (entity.parent) {
        const parent = getNodeWithUUID(scene, entity.parent);

        if (!parent) {
          throw new Error(
            `Node "${entity.name}" with uuid "${entity.uuid}" specifies parent "${entity.parent}", but was not found.`
          );
        }

        parent.children.splice(entity.index, 0, node);
        node.parent = parent;
      } else if (entityId === root) {
        scene = node;
        scene.metadata = metadata;
        // Needed so that editor.scene is set correctly when used in nodes deserialize methods.
        editor.scene = scene;
      } else {
        throw new Error(`Node "${entity.name}" with uuid "${entity.uuid}" does not specify a parent.`);
      }

      node.onChange();
    }

    await Promise.all(dependencies);

    return [scene, errors];
  }

  static shouldDeserialize(entityJson) {
    return entityJson.parent === undefined;
  }

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    if (json.components) {
      const fog = json.components.find(c => c.name === "fog");

      if (fog) {
        const { type, color, density, near, far } = fog.props;
        node.fogType = type;
        node.fogColor.set(color);
        node.fogDensity = density;
        node.fogNearDistance = near;
        node.fogFarDistance = far;
      }

      const background = json.components.find(c => c.name === "background");

      if (background) {
        const { color } = background.props;
        node.background.set(color);
      }

      const audioSettings = json.components.find(c => c.name === "audio-settings");

      if (audioSettings) {
        const props = audioSettings.props;
        node.overrideAudioSettings = props.overrideAudioSettings;
        node.avatarDistanceModel = props.avatarDistanceModel;
        node.avatarRolloffFactor = props.avatarRolloffFactor;
        node.avatarRefDistance = props.avatarRefDistance;
        node.avatarMaxDistance = props.avatarMaxDistance;
        node.mediaVolume = props.mediaVolume;
        node.mediaDistanceModel = props.mediaDistanceModel;
        node.mediaRolloffFactor = props.mediaRolloffFactor;
        node.mediaRefDistance = props.mediaRefDistance;
        node.mediaMaxDistance = props.mediaMaxDistance;
        node.mediaConeInnerAngle = props.mediaConeInnerAngle;
        node.mediaConeOuterAngle = props.mediaConeOuterAngle;
        node.mediaConeOuterGain = props.mediaConeOuterGain;
      }
    }

    return node;
  }

  constructor(editor) {
    super(editor);
    this.url = null;
    this.metadata = {};
    this.background = new Color(0xaaaaaa);
    this._environmentMap = null;
    this._fogType = FogType.Disabled;
    this._fog = new Fog(0xffffff, 0.0025);
    this._fogExp2 = new FogExp2(0xffffff, 0.0025);
    this.fog = null;
    this.overrideAudioSettings = false;
    this.avatarDistanceModel = DistanceModelType.Inverse;
    this.avatarRolloffFactor = 2;
    this.avatarRefDistance = 1;
    this.avatarMaxDistance = 10000;
    this.mediaVolume = 0.5;
    this.mediaDistanceModel = DistanceModelType.Inverse;
    this.mediaRolloffFactor = 1;
    this.mediaRefDistance = 1;
    this.mediaMaxDistance = 10000;
    this.mediaConeInnerAngle = 360;
    this.mediaConeOuterAngle = 0;
    this.mediaConeOuterGain = 0;
    setStaticMode(this, StaticModes.Static);
  }

  get fogType() {
    return this._fogType;
  }

  set fogType(type) {
    this._fogType = type;

    switch (type) {
      case FogType.Linear:
        this.fog = this._fog;
        break;
      case FogType.Exponential:
        this.fog = this._fogExp2;
        break;
      default:
        this.fog = null;
        break;
    }
  }

  get fogColor() {
    if (this.fogType === FogType.Linear) {
      return this._fog.color;
    } else {
      return this._fogExp2.color;
    }
  }

  get fogDensity() {
    return this._fogExp2.density;
  }

  set fogDensity(value) {
    this._fogExp2.density = value;
  }

  get fogNearDistance() {
    return this._fog.near;
  }

  set fogNearDistance(value) {
    this._fog.near = value;
  }

  get fogFarDistance() {
    return this._fog.far;
  }

  set fogFarDistance(value) {
    this._fog.far = value;
  }

  get environmentMap() {
    return this._environmentMap;
  }

  updateEnvironmentMap(environmentMap) {
    this._environmentMap = environmentMap;

    this.traverse(object => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.envMap = environmentMap;
        object.material.needsUpdate = true;
      }
    });
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);

    this.url = source.url;
    this.metadata = source.metadata;
    this._environmentMap = source._environmentMap;
    this.fogType = source.fogType;
    this.fogColor.copy(source.fogColor);
    this.fogDensity = source.fogDensity;
    this.fogNearDistance = source.fogNearDistance;
    this.fogFarDistance = source.fogFarDistance;
    this.overrideAudioSettings = source.overrideAudioSettings;
    this.avatarDistanceModel = source.avatarDistanceModel;
    this.avatarRolloffFactor = source.avatarRolloffFactor;
    this.avatarRefDistance = source.avatarRefDistance;
    this.avatarMaxDistance = source.avatarMaxDistance;
    this.mediaVolume = source.mediaVolume;
    this.mediaDistanceModel = source.mediaDistanceModel;
    this.mediaRolloffFactor = source.mediaRolloffFactor;
    this.mediaRefDistance = source.mediaRefDistance;
    this.mediaMaxDistance = source.mediaMaxDistance;
    this.mediaConeInnerAngle = source.mediaConeInnerAngle;
    this.mediaConeOuterAngle = source.mediaConeOuterAngle;
    this.mediaConeOuterGain = source.mediaConeOuterGain;

    return this;
  }

  serialize() {
    const sceneJson = {
      version: 5,
      root: this.uuid,
      metadata: JSON.parse(JSON.stringify(this.metadata)),
      entities: {
        [this.uuid]: {
          name: this.name,
          components: [
            {
              name: "fog",
              props: {
                type: this.fogType,
                color: serializeColor(this.fogColor),
                near: this.fogNearDistance,
                far: this.fogFarDistance,
                density: this.fogDensity
              }
            },
            {
              name: "background",
              props: {
                color: serializeColor(this.background)
              }
            },
            {
              name: "audio-settings",
              props: {
                overrideAudioSettings: this.overrideAudioSettings,
                avatarDistanceModel: this.avatarDistanceModel,
                avatarRolloffFactor: this.avatarRolloffFactor,
                avatarRefDistance: this.avatarRefDistance,
                avatarMaxDistance: this.avatarMaxDistance,
                mediaVolume: this.mediaVolume,
                mediaDistanceModel: this.mediaDistanceModel,
                mediaRolloffFactor: this.mediaRolloffFactor,
                mediaRefDistance: this.mediaRefDistance,
                mediaMaxDistance: this.mediaMaxDistance,
                mediaConeInnerAngle: this.mediaConeInnerAngle,
                mediaConeOuterAngle: this.mediaConeOuterAngle,
                mediaConeOuterGain: this.mediaConeOuterGain
              }
            }
          ]
        }
      }
    };

    this.traverse(child => {
      if (!child.isNode || child === this) {
        return;
      }

      const entityJson = child.serialize();
      entityJson.parent = child.parent.uuid;

      let index = 0;

      for (const sibling of child.parent.children) {
        if (sibling === child) {
          break;
        } else if (sibling.isNode) {
          index++;
        }
      }

      entityJson.index = index;
      sceneJson.entities[child.uuid] = entityJson;
    });

    return sceneJson;
  }

  serializeScn() {
    const sceneJson = {
      objects: [
        {
          position: [0, 0, 0],
          content: {
            root: this.uuid,
            name: this.name,
            skyboxId: "",
            components: [
              {
                name: "fog",
                props: {
                  type: this.fogType,
                  color: serializeColor(this.fogColor),
                  near: this.fogNearDistance,
                  far: this.fogFarDistance,
                  density: this.fogDensity
                }
              },
              {
                name: "background",
                props: {
                  color: serializeColor(this.background)
                }
              },
              {
                name: "audio-settings",
                props: {
                  overrideAudioSettings: this.overrideAudioSettings,
                  avatarDistanceModel: this.avatarDistanceModel,
                  avatarRolloffFactor: this.avatarRolloffFactor,
                  avatarRefDistance: this.avatarRefDistance,
                  avatarMaxDistance: this.avatarMaxDistance,
                  mediaVolume: this.mediaVolume,
                  mediaDistanceModel: this.mediaDistanceModel,
                  mediaRolloffFactor: this.mediaRolloffFactor,
                  mediaRefDistance: this.mediaRefDistance,
                  mediaMaxDistance: this.mediaMaxDistance,
                  mediaConeInnerAngle: this.mediaConeInnerAngle,
                  mediaConeOuterAngle: this.mediaConeOuterAngle,
                  mediaConeOuterGain: this.mediaConeOuterGain
                }
              }
            ]
          }
        }
      ]
    };

    for (const sibling of this.children) {
      if (sibling.name === "Skybox") {
        sceneJson.objects[0].content.skyboxId = sibling.uuid;
      } else if (sibling.type === "Model") {
        const object = {
          position: [sibling.position.x, sibling.position.y, sibling.position.z],
          physics: sibling.collidable,
          quaternion: [sibling.quaternion._x, sibling.quaternion._y, sibling.quaternion._z, sibling.quaternion._w],
          start_url: sibling._canonicalUrl,
          dynamic: true,
          content: {
            name: sibling.name,
            uuid: sibling.uuid
          }
        };
        sceneJson.objects.push(object);
      } else if (sibling.type.includes("Light")) {
        const object = {
          type: "application/light",
          content: {
            name: sibling.name,
            lightType: sibling.name.split(" ")[0].toLowerCase(),
            args: [[255, 255, 255], 5],
            position: [sibling.position.x, sibling.position.y, sibling.position.z],
            color: sibling.color,
            uuid: sibling.uuid
          }
        };
        sceneJson.objects.push(object);
      }
    }

    return sceneJson;
  }

  prepareForExport(ctx) {
    this.children = this.children.filter(c => c.isNode);

    const nodeList = [];

    this.traverse(child => {
      if (child.isNode && child !== this) {
        nodeList.push(child);
      }
    });

    for (const node of nodeList) {
      if (node.enabled) {
        node.prepareForExport(ctx);
      } else {
        node.parent.remove(node);
      }
    }

    this.addGLTFComponent("background", {
      color: this.background
    });

    if (this.fogType === FogType.Linear) {
      this.addGLTFComponent("fog", {
        type: this.fogType,
        color: serializeColor(this.fogColor),
        near: this.fogNearDistance,
        far: this.fogFarDistance
      });
    } else if (this.fogType === FogType.Exponential) {
      this.addGLTFComponent("fog", {
        type: this.fogType,
        color: serializeColor(this.fogColor),
        density: this.fogDensity
      });
    }

    if (this.overrideAudioSettings) {
      this.addGLTFComponent("audio-settings", {
        avatarDistanceModel: this.avatarDistanceModel,
        avatarRolloffFactor: this.avatarRolloffFactor,
        avatarRefDistance: this.avatarRefDistance,
        avatarMaxDistance: this.avatarMaxDistance,
        mediaVolume: this.mediaVolume,
        mediaDistanceModel: this.mediaDistanceModel,
        mediaRolloffFactor: this.mediaRolloffFactor,
        mediaRefDistance: this.mediaRefDistance,
        mediaMaxDistance: this.mediaMaxDistance,
        mediaConeInnerAngle: this.mediaConeInnerAngle,
        mediaConeOuterAngle: this.mediaConeOuterAngle,
        mediaConeOuterGain: this.mediaConeOuterGain
      });
    }
  }

  async combineMeshes() {
    await MeshCombinationGroup.combineMeshes(this);
  }

  removeUnusedObjects() {
    this.computeAndSetStaticModes();

    function hasExtrasOrExtensions(object) {
      const userData = object.userData;
      for (const key in userData) {
        if (Object.prototype.hasOwnProperty.call(userData, key)) {
          return true;
        }
      }
      return false;
    }

    function _removeUnusedObjects(object) {
      let canBeRemoved = !!object.parent;

      for (const child of object.children.slice(0)) {
        if (!_removeUnusedObjects(child)) {
          canBeRemoved = false;
        }
      }

      const shouldRemove =
        canBeRemoved &&
        (object.constructor === Object3D ||
          object.constructor === Scene ||
          object.constructor === Group ||
          object.constructor === GroupNode) &&
        object.children.length === 0 &&
        isStatic(object) &&
        !hasExtrasOrExtensions(object);

      if (canBeRemoved && shouldRemove) {
        object.parent.remove(object);
        return true;
      }
      return false;
    }

    _removeUnusedObjects(this);
  }

  getAnimationClips() {
    const animations = [];

    traverseFilteredSubtrees(this, child => {
      if (!child.isNode) {
        return;
      }

      if (!child.enabled) {
        return false;
      }

      if (child.type === "Model") {
        animations.push(...child.clips);
      }
    });

    return animations;
  }

  getContentAttributions() {
    const contentAttributions = [];
    const seenAttributions = new Set();

    traverseFilteredSubtrees(this, obj => {
      if (!obj.isNode) {
        return;
      }

      if (!obj.enabled) {
        return false;
      }

      const attribution = obj.attribution;

      if (!attribution) return;

      const attributionKey = attribution.url || `${attribution.title}_${attribution.author}`;
      if (seenAttributions.has(attributionKey)) return;
      seenAttributions.add(attributionKey);
      contentAttributions.push(attribution);
    });

    return contentAttributions;
  }

  clearMetadata() {
    this.metadata = {};
  }

  setMetadata(newMetadata) {
    const existingMetadata = this.metadata || {};
    this.metadata = Object.assign(existingMetadata, newMetadata);
  }
}
